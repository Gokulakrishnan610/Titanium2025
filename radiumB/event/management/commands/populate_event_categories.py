"""
Management command to populate default Event Categories
"""
from django.core.management.base import BaseCommand
from event.models import EventCategory


class Command(BaseCommand):
    help = 'Populate default Event Category choices'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before populating',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing event categories...')
            EventCategory.objects.all().delete()
            self.stdout.write(self.style.WARNING('✓ Cleared existing event categories'))
        
        self.stdout.write('Populating default event categories...')
        
        # Populate Event Categories
        EventCategory.populate_defaults()
        category_count = EventCategory.objects.count()
        self.stdout.write(self.style.SUCCESS(f'✓ Total {category_count} event category choices'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Default event categories populated successfully!'))
        self.stdout.write('You can now manage these categories from the Django admin panel.')
        self.stdout.write('\nAPI Endpoints:')
        self.stdout.write('  - GET /api/events/categories/')
        self.stdout.write('  - POST /api/events/categories/create/ (Admin only)')
        self.stdout.write('  - PUT/PATCH /api/events/categories/<id>/update/ (Admin only)')
        self.stdout.write('  - DELETE /api/events/categories/<id>/delete/ (Admin only)')