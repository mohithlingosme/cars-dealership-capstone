# Cars Dealership Application

A full-stack car dealership directory built for the **IBM Full Stack Software Developer
Professional Certificate — Capstone Project**.

Customers can browse dealerships across the United States, filter them by state, read customer
reviews, register, log in, and post their own reviews. A sentiment-analysis service scores every
review as positive, neutral, or negative.

## Architecture

```
                    ┌────────────────────────────┐
  Browser ─────────▶│  Django (server)           │
                    │  · REST API /djangoapp/*   │
                    │  · session auth + admin    │
                    │  · serves React build      │
                    │  · car makes & models API  │
                    └───────┬────────────┬───────┘
                            │            │
              ┌─────────────▼──┐   ┌─────▼──────────────┐
              │ Node.js +      │   │ Flask              │
              │ Express service│   │ sentiment service  │
              │ (port 3030)    │   │ (port 5000)        │
              └───────┬────────┘   └────────────────────┘
                      │              VADER sentiment lexicon
              ┌───────▼────────┐
              │ MongoDB        │
              │ dealers,       │
              │ reviews        │
              └────────────────┘
```

| Layer | Technology | Location |
|---|---|---|
| Web application & API | Django 5.1, Python 3.11 | `server/` |
| Frontend | React 18 + React Router (Vite) | `server/frontend/src` |
| Static About / Contact pages | HTML + CSS | `server/frontend/static` |
| Dealership microservice | Node.js, Express, MongoDB driver | `server/database` |
| Sentiment analysis | Flask + VADER | `server/sentiment` |
| Deployment | Docker, Docker Compose | `server/**/Dockerfile`, `docker-compose.yml` |
| CI | GitHub Actions | `.github/workflows/main.yml` |

## Features

- Responsive landing page with dealership hero and feature overview
- Dealer directory with **filter by state** (`/dealers/Kansas`)
- Dealer detail page with customer reviews and sentiment badges
- Registration (username, first name, last name, email, password) with validation
- Session-based login / logout
- Authenticated review submission with purchase details and automatic sentiment scoring
- Django admin for dealers, reviews, car makes and car models
- REST endpoints for dealers, reviews, car makes/models and sentiment analysis
- 10 car makes and 20 models seeded from `server/data/seed.json`
- 8 dealerships across 6 states, 7 seeded reviews

## Repository layout

```
.
├── .github/workflows/main.yml     GitHub Actions CI
├── docker-compose.yml             Full local stack (web + dealership + sentiment + mongo)
├── server/
│   ├── manage.py
│   ├── requirements.txt
│   ├── djangoproject/             Django settings, URLs, WSGI
│   ├── djangoapp/                 models, views, admin, tests, seed command
│   ├── frontend/                  React source, static pages, Vite build config
│   ├── database/                  Node/Express/MongoDB dealership service
│   ├── sentiment/                 Flask VADER sentiment service
│   └── data/seed.json             Shared sample data for Django and MongoDB
└── submission/                     Capstone evidence, screenshots and answers
```

## Local setup (Windows, Git Bash)

Prerequisites: Python 3.11, Node.js 20+, npm.

```bash
# 1. Python environment
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r server/requirements.txt

# 2. Frontend build
cd server/frontend
npm install
npm run build
cd ../..

# 3. Node service dependencies
cd server/database
npm install
cd ../..

# 4. Database migrations and sample data
cd server
../.venv/Scripts/python.exe manage.py migrate
../.venv/Scripts/python.exe manage.py seed_data
```

Run the services in four terminals:

```bash
# Terminal 1 — MongoDB + dealership service (in-process MongoDB for local development)
cd server/database && npm run start:memory

# Terminal 2 — sentiment service
cd server/sentiment && ../../.venv/Scripts/python.exe app.py

# Terminal 3 — Django
cd server && ../.venv/Scripts/python.exe manage.py runserver 127.0.0.1:8000
```

Open <http://127.0.0.1:8000>.

To use an existing MongoDB instead of the in-process server:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/dealership npm start
```

### Django admin

Create your own superuser locally (the password is yours to choose and must not be committed):

```bash
cd server
../.venv/Scripts/python.exe manage.py createsuperuser
```

Then sign in at <http://127.0.0.1:8000/admin/>.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/djangoapp/login` | Authenticate a user (JSON `userName`, `password`) |
| GET | `/djangoapp/logout` | End the session |
| POST | `/djangoapp/register` | Register a customer |
| GET | `/djangoapp/get_user` | Current session user |
| GET | `/djangoapp/get_dealers` | All dealerships |
| GET | `/djangoapp/get_dealers/<state>` | Dealerships filtered by state |
| GET | `/djangoapp/get_dealer/<id>` | Dealer details by ID |
| GET | `/djangoapp/reviews/dealer/<id>` | Reviews for a dealer |
| POST | `/djangoapp/add_review` | Submit a review (login required) |
| GET | `/djangoapp/get_cars` | All car makes and models |
| GET | `/djangoapp/analyze/<text>` | Sentiment analysis for text |
| GET | `/djangoapp/health` | Health of Django and both microservices |

Behind the API:

| Method | Path | Service |
|---|---|---|
| GET | `http://127.0.0.1:3030/dealers` | Node dealership service |
| GET | `http://127.0.0.1:3030/dealers/<state>` | Node dealership service |
| GET | `http://127.0.0.1:3030/dealer/<id>` | Node dealership service |
| GET | `http://127.0.0.1:3030/reviews/dealer/<id>` | Node dealership service |
| POST | `http://127.0.0.1:3030/review` | Node dealership service |
| POST | `http://127.0.0.1:5000/analyze` | Flask sentiment service |

## Environment variables

| Variable | Used by | Default |
|---|---|---|
| `DJANGO_SECRET_KEY` | Django | Dev-only insecure default |
| `DJANGO_DEBUG` | Django | `True` |
| `DJANGO_ALLOWED_HOSTS` | Django | localhost, 127.0.0.1, testserver |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Django | localhost:8000 |
| `DEALERSHIP_SERVICE_URL` | Django | `http://127.0.0.1:3030` |
| `SENTIMENT_SERVICE_URL` | Django | `http://127.0.0.1:5000` |
| `MONGODB_URI` | Node service | `mongodb://127.0.0.1:27017/dealership` |
| `PORT` | Node / Flask | `3030` / `5000` |

## Tests and CI

```bash
# Django
cd server && ../.venv/Scripts/python.exe manage.py test djangoapp

# Node service
cd server/database && npm test

# Frontend lint + build
cd server/frontend && npm run lint && npm run build
```

`.github/workflows/main.yml` runs the Django tests, Node tests, frontend lint/build, a Flask
sentiment smoke test, and builds all three Docker images on every push and pull request.

## Docker

```bash
export DJANGO_SECRET_KEY="$(openssl rand -hex 32)"
docker compose up --build
```

The stack exposes the Django application at <http://localhost:8000>, the dealership service on
port 3030 internally, and the sentiment service on port 5000 internally.

## Deployment notes

The images are deployment-ready for any container platform, including IBM Cloud Code Engine:

1. Build and push the three images (`server/Dockerfile`, `server/database/Dockerfile`,
   `server/sentiment/Dockerfile`) to a container registry.
2. Create a Code Engine application for each service, setting `MONGODB_URI`,
   `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`,
   `DEALERSHIP_SERVICE_URL`, and `SENTIMENT_SERVICE_URL` as environment variables.
3. Point `DJANGO_ALLOWED_HOSTS` and `DJANGO_CSRF_TRUSTED_ORIGINS` at the deployed hostnames.

No deployment URL is committed to this repository because no cloud account credentials are
included.

## Sample data notice

All dealerships, reviews, team members, addresses, and phone numbers in this project are
fictional sample data created for the capstone. The About page team profiles are explicitly
labelled as fictional. Email addresses use the reserved `example.com` domain.
