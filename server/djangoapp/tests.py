from unittest.mock import Mock, patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .models import CarMake, CarModel, Dealer, Review


class ModelTests(TestCase):
    def setUp(self):
        self.dealer = Dealer.objects.create(
            full_name='Test Motors',
            short_name='Test Motors',
            address='1 Test Way',
            city='Topeka',
            state='Kansas',
            zip_code='66601',
            latitude=39.0,
            longitude=-95.7,
        )

    def test_review_belongs_to_dealer(self):
        Review.objects.create(dealer=self.dealer, name='tester', review='Great cars', sentiment='positive')
        self.assertEqual(self.dealer.reviews.count(), 1)


class AuthApiTests(TestCase):
    def test_register_creates_and_logs_in_user(self):
        response = self.client.post(
            '/djangoapp/register',
            data={
                'userName': 'newbuyer',
                'firstName': 'New',
                'lastName': 'Buyer',
                'email': 'new.buyer@example.com',
                'password': 'Str0ngPass!2026',
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(username='newbuyer').exists())
        self.assertEqual(self.client.get('/djangoapp/get_user').json()['userName'], 'newbuyer')

    def test_register_requires_all_fields(self):
        response = self.client.post(
            '/djangoapp/register',
            data={'userName': 'onlyname'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)

    def test_login_and_logout(self):
        User.objects.create_user(username='loginuser', password='Str0ngPass!2026')
        response = self.client.post(
            '/djangoapp/login',
            data={'userName': 'loginuser', 'password': 'Str0ngPass!2026'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'Authenticated')

        logout_response = self.client.get('/djangoapp/logout')
        self.assertEqual(logout_response.json()['userName'], '')
        self.assertEqual(self.client.get('/djangoapp/get_user').json()['userName'], '')

    def test_login_rejects_bad_password(self):
        User.objects.create_user(username='loginuser', password='Str0ngPass!2026')
        response = self.client.post(
            '/djangoapp/login',
            data={'userName': 'loginuser', 'password': 'wrong-password'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 401)


class CarsApiTests(TestCase):
    def test_get_cars_groups_models_by_make(self):
        make = CarMake.objects.create(name='Toyota')
        CarModel.objects.create(car_make=make, name='Camry', type='Sedan', year=2024)
        CarModel.objects.create(car_make=make, name='Corolla', type='Sedan', year=2023)

        response = self.client.get('/djangoapp/get_cars')
        payload = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['status'], 200)
        self.assertEqual(payload['CarMakes'][0]['name'], 'Toyota')
        self.assertEqual(len(payload['CarMakes'][0]['models']), 2)


class SentimentProxyTests(TestCase):
    @patch('djangoapp.views.requests.post')
    def test_analyze_review_returns_service_sentiment(self, mock_post):
        mock_post.return_value = Mock(
            status_code=200,
            json=lambda: {'sentiment': 'positive', 'compound': 0.5574},
            raise_for_status=lambda: None,
        )
        response = self.client.get('/djangoapp/analyze/Fantastic services')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['sentiment'], 'positive')


class ReviewApiTests(TestCase):
    @patch('djangoapp.views.requests.get')
    @patch('djangoapp.views.requests.post')
    def test_add_review_requires_login(self, mock_post, mock_get):
        response = self.client.post(
            '/djangoapp/add_review',
            data={'dealer_id': 1, 'review': 'Nice place'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 401)

    @patch('djangoapp.views.requests.get')
    @patch('djangoapp.views.requests.post')
    def test_add_review_stores_review(self, mock_post, mock_get):
        dealer = Dealer.objects.create(
            id=99,
            full_name='Test Motors',
            short_name='Test Motors',
            address='1 Test Way',
            city='Topeka',
            state='Kansas',
            zip_code='66601',
            latitude=39.0,
            longitude=-95.7,
        )
        mock_get.return_value = Mock(status_code=200, json=lambda: {'dealer': {'dealer_id': 99}})
        mock_post.return_value = Mock(
            status_code=200,
            json=lambda: {'sentiment': 'positive'},
            raise_for_status=lambda: None,
        )
        user = User.objects.create_user(username='reviewer', password='Str0ngPass!2026')
        self.client.force_login(user)

        response = self.client.post(
            '/djangoapp/add_review',
            data={
                'dealer_id': dealer.id,
                'review': 'Fantastic services and very helpful staff.',
                'car_make': 'Honda',
                'car_model': 'Civic',
                'car_year': 2024,
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Review.objects.filter(dealer=dealer).count(), 1)
        self.assertEqual(Review.objects.get(dealer=dealer).sentiment, 'positive')


class StaticPageTests(TestCase):
    def test_about_and_contact_pages_render(self):
        self.assertEqual(self.client.get(reverse('about')).status_code, 200)
        self.assertEqual(self.client.get(reverse('contact')).status_code, 200)
