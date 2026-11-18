import json
from pathlib import Path

from django.core.management.base import BaseCommand

from djangoapp.models import CarMake, CarModel, Dealer, Review

SEED_FILE = Path(__file__).resolve().parents[3] / 'data' / 'seed.json'


class Command(BaseCommand):
    help = 'Load dealership, review and car make/model sample data.'

    def handle(self, *args, **options):
        with open(SEED_FILE, encoding='utf-8') as handle:
            seed = json.load(handle)

        for item in seed['dealers']:
            Dealer.objects.update_or_create(
                id=item['id'],
                defaults={
                    'full_name': item['full_name'],
                    'short_name': item['short_name'],
                    'address': item['address'],
                    'city': item['city'],
                    'state': item['state'],
                    'zip_code': item['zip'],
                    'latitude': item['lat'],
                    'longitude': item['long'],
                },
            )

        for item in seed['reviews']:
            Review.objects.update_or_create(
                dealer_id=item['dealer_id'],
                name=item['name'],
                review=item['review'],
                defaults={
                    'sentiment': item['sentiment'],
                    'purchase': item['purchase'],
                    'purchase_date': item['purchase_date'],
                    'car_make': item['car_make'],
                    'car_model': item['car_model'],
                    'car_year': item['car_year'],
                },
            )

        for item in seed['car_makes']:
            make, _ = CarMake.objects.get_or_create(name=item['name'])
            for model in item['models']:
                CarModel.objects.update_or_create(
                    car_make=make,
                    name=model['name'],
                    defaults={'type': model['type'], 'year': model['year']},
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Seeded {Dealer.objects.count()} dealers, '
                f'{Review.objects.count()} reviews, '
                f'{CarMake.objects.count()} car makes, '
                f'{CarModel.objects.count()} car models.'
            )
        )
