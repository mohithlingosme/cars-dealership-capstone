import json
import logging

import requests
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import FileResponse, Http404, JsonResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .models import CarMake, Review

logger = logging.getLogger(__name__)

FRONTEND_BUILD = settings.BASE_DIR / 'frontend' / 'build'
FRONTEND_STATIC = settings.BASE_DIR / 'frontend' / 'static'


def _json_error(message, status):
    return JsonResponse({'status': status, 'error': message}, status=status)


def _service_get(path):
    url = f'{settings.DEALERSHIP_SERVICE_URL.rstrip("/")}{path}'
    return requests.get(url, timeout=settings.SERVICE_TIMEOUT_SECONDS)


@ensure_csrf_cookie
def spa_index(request, route=''):
    index = FRONTEND_BUILD / 'index.html'
    if not index.exists():
        return JsonResponse(
            {
                'status': 503,
                'error': 'Frontend build not found. Run "npm install && npm run build" in server/frontend.',
            },
            status=503,
        )
    return FileResponse(open(index, 'rb'), content_type='text/html')


def _static_page(filename):
    path = FRONTEND_STATIC / filename
    if not path.exists():
        raise Http404(f'{filename} not found')
    return FileResponse(open(path, 'rb'), content_type='text/html')


def about_page(request):
    return _static_page('About.html')


def contact_page(request):
    return _static_page('Contact.html')


@csrf_exempt
@require_http_methods(['POST'])
def login_user(request):
    try:
        body = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return _json_error('Invalid JSON body', 400)

    username = body.get('userName', '').strip()
    password = body.get('password', '')
    if not username or not password:
        return _json_error('userName and password are required', 400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({'userName': '', 'status': 'Failed'}, status=401)

    login(request, user)
    return JsonResponse({'userName': user.username, 'status': 'Authenticated'})


@require_http_methods(['GET', 'POST'])
def logout_user(request):
    logout(request)
    return JsonResponse({'userName': ''})


@ensure_csrf_cookie
@require_http_methods(['GET'])
def get_user(request):
    if request.user.is_authenticated:
        return JsonResponse({'userName': request.user.username})
    return JsonResponse({'userName': ''})


@csrf_exempt
@require_http_methods(['POST'])
def register_user(request):
    try:
        body = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return _json_error('Invalid JSON body', 400)

    required = ['userName', 'firstName', 'lastName', 'email', 'password']
    missing = [field for field in required if not str(body.get(field, '')).strip()]
    if missing:
        return _json_error(f'Missing required fields: {", ".join(missing)}', 400)

    username = body['userName'].strip()
    email = body['email'].strip()
    if User.objects.filter(username=username).exists():
        return _json_error('An account with this username already exists', 409)
    if User.objects.filter(email=email).exists():
        return _json_error('An account with this email already exists', 409)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=body['password'],
        first_name=body['firstName'].strip(),
        last_name=body['lastName'].strip(),
    )
    login(request, user)
    return JsonResponse(
        {
            'userName': user.username,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'email': user.email,
            'status': 201,
        },
        status=201,
    )


@require_http_methods(['GET'])
def get_dealers(request):
    try:
        upstream = _service_get('/dealers')
    except requests.RequestException as exc:
        logger.exception('Dealership service unavailable')
        return _json_error(f'Dealership service unavailable: {exc}', 503)
    return JsonResponse(upstream.json(), status=upstream.status_code, safe=False)


@require_http_methods(['GET'])
def get_dealer_by_id(request, dealer_id):
    try:
        upstream = _service_get(f'/dealer/{dealer_id}')
    except requests.RequestException as exc:
        logger.exception('Dealership service unavailable')
        return _json_error(f'Dealership service unavailable: {exc}', 503)
    return JsonResponse(upstream.json(), status=upstream.status_code, safe=False)


@require_http_methods(['GET'])
def get_dealers_by_state(request, state):
    try:
        upstream = _service_get(f'/dealers/{state}')
    except requests.RequestException as exc:
        logger.exception('Dealership service unavailable')
        return _json_error(f'Dealership service unavailable: {exc}', 503)
    return JsonResponse(upstream.json(), status=upstream.status_code, safe=False)


@require_http_methods(['GET'])
def get_dealer_reviews(request, dealer_id):
    try:
        upstream = _service_get(f'/reviews/dealer/{dealer_id}')
    except requests.RequestException as exc:
        logger.exception('Dealership service unavailable')
        return _json_error(f'Dealership service unavailable: {exc}', 503)
    return JsonResponse(upstream.json(), status=upstream.status_code, safe=False)


@require_http_methods(['GET'])
def get_cars(request):
    makes = []
    for car_make in CarMake.objects.prefetch_related('models').order_by('name'):
        makes.append(
            {
                'name': car_make.name,
                'models': [
                    {'name': m.name, 'type': m.type, 'year': m.year}
                    for m in car_make.models.order_by('name')
                ],
            }
        )
    return JsonResponse({'CarMakes': makes, 'status': 200})


def _analyze_sentiment(text):
    response = requests.post(
        f'{settings.SENTIMENT_SERVICE_URL.rstrip("/")}/analyze',
        json={'text': text},
        timeout=settings.SERVICE_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()


@require_http_methods(['GET'])
def analyze_review(request, text):
    try:
        payload = _analyze_sentiment(text)
    except (requests.RequestException, ValueError) as exc:
        logger.exception('Sentiment service unavailable')
        return _json_error(f'Sentiment service unavailable: {exc}', 503)
    return JsonResponse({'text': text, 'sentiment': payload.get('sentiment')})


@csrf_exempt
@require_http_methods(['POST'])
def add_review(request):
    if not request.user.is_authenticated:
        return _json_error('Authentication required to submit a review', 401)

    try:
        body = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return _json_error('Invalid JSON body', 400)

    dealer_id = body.get('dealer_id')
    review_text = str(body.get('review', '')).strip()
    if not dealer_id or not review_text:
        return _json_error('dealer_id and review are required', 400)

    try:
        dealer_response = _service_get(f'/dealer/{dealer_id}')
    except requests.RequestException as exc:
        return _json_error(f'Dealership service unavailable: {exc}', 503)
    if dealer_response.status_code != 200:
        return _json_error('Dealer not found', 404)

    try:
        sentiment = _analyze_sentiment(review_text).get('sentiment', 'neutral')
    except (requests.RequestException, ValueError):
        sentiment = 'neutral'

    payload = {
        'dealer_id': int(dealer_id),
        'name': request.user.username,
        'review': review_text,
        'sentiment': sentiment,
        'purchase': bool(body.get('purchase', False)),
        'purchase_date': body.get('purchase_date') or None,
        'car_make': body.get('car_make', ''),
        'car_model': body.get('car_model', ''),
        'car_year': body.get('car_year') or None,
    }

    Review.objects.create(
        dealer_id=dealer_id,
        name=payload['name'],
        review=payload['review'],
        sentiment=sentiment,
        purchase=payload['purchase'],
        purchase_date=payload['purchase_date'],
        car_make=payload['car_make'],
        car_model=payload['car_model'],
        car_year=payload['car_year'],
    )

    try:
        requests.post(
            f'{settings.DEALERSHIP_SERVICE_URL.rstrip("/")}/review',
            json=payload,
            timeout=settings.SERVICE_TIMEOUT_SECONDS,
        )
    except requests.RequestException:
        logger.exception('Could not mirror review to dealership service')

    return JsonResponse({'status': 201, 'sentiment': sentiment, 'review': payload}, status=201)


@require_http_methods(['GET'])
def health(request):
    status = {'django': 'ok', 'dealership_service': 'unknown', 'sentiment_service': 'unknown'}
    try:
        requests.get(
            f'{settings.DEALERSHIP_SERVICE_URL.rstrip("/")}/health',
            timeout=2,
        ).raise_for_status()
        status['dealership_service'] = 'ok'
    except requests.RequestException:
        status['dealership_service'] = 'unavailable'
    try:
        requests.get(
            f'{settings.SENTIMENT_SERVICE_URL.rstrip("/")}/health',
            timeout=2,
        ).raise_for_status()
        status['sentiment_service'] = 'ok'
    except requests.RequestException:
        status['sentiment_service'] = 'unavailable'
    overall = 200 if all(v == 'ok' for v in status.values()) else 503
    return JsonResponse({'status': overall, 'services': status}, status=overall)
