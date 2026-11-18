from django.db import models


class CarMake(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class CarModel(models.Model):
    car_make = models.ForeignKey(CarMake, on_delete=models.CASCADE, related_name='models')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=50)
    year = models.IntegerField()

    class Meta:
        unique_together = ('car_make', 'name')

    def __str__(self):
        return f'{self.car_make.name} {self.name}'


class Dealer(models.Model):
    full_name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=100)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=50)
    zip_code = models.CharField(max_length=20)
    latitude = models.FloatField()
    longitude = models.FloatField()

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.full_name


class Review(models.Model):
    dealer = models.ForeignKey(Dealer, on_delete=models.CASCADE, related_name='reviews')
    name = models.CharField(max_length=100)
    review = models.TextField()
    sentiment = models.CharField(max_length=20, blank=True)
    purchase = models.BooleanField(default=False)
    purchase_date = models.DateField(null=True, blank=True)
    car_make = models.CharField(max_length=100, blank=True)
    car_model = models.CharField(max_length=100, blank=True)
    car_year = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.name} review for {self.dealer.short_name}'
