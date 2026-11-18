from django.urls import path

from . import views

urlpatterns = [
    path('login', views.login_user, name='login'),
    path('logout', views.logout_user, name='logout'),
    path('get_user', views.get_user, name='get_user'),
    path('register', views.register_user, name='register'),
    path('get_dealers', views.get_dealers, name='get_dealers'),
    path('get_dealers/<str:state>', views.get_dealers_by_state, name='get_dealers_by_state'),
    path('get_dealer/<int:dealer_id>', views.get_dealer_by_id, name='get_dealer_by_id'),
    path('reviews/dealer/<int:dealer_id>', views.get_dealer_reviews, name='get_dealer_reviews'),
    path('add_review', views.add_review, name='add_review'),
    path('get_cars', views.get_cars, name='get_cars'),
    path('analyze/<str:text>', views.analyze_review, name='analyze_review'),
    path('health', views.health, name='health'),
]
