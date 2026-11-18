from django.contrib import admin
from django.urls import include, path

from djangoapp import views as app_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('djangoapp/', include('djangoapp.urls')),
    path('About.html', app_views.about_page, name='about'),
    path('Contact.html', app_views.contact_page, name='contact'),
    path('', app_views.spa_index, name='home'),
    path('<path:route>', app_views.spa_index, name='spa'),
]
