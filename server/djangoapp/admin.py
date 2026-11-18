from django.contrib import admin

from .models import CarMake, CarModel, Dealer, Review


@admin.register(CarMake)
class CarMakeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(CarModel)
class CarModelAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'car_make', 'type', 'year')
    list_filter = ('car_make', 'type')
    search_fields = ('name',)


@admin.register(Dealer)
class DealerAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'city', 'state', 'zip_code')
    list_filter = ('state',)
    search_fields = ('full_name', 'city', 'state')


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'dealer', 'name', 'sentiment', 'purchase', 'car_make', 'car_model')
    list_filter = ('sentiment', 'purchase')
    search_fields = ('name', 'review')
