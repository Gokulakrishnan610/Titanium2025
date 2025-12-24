"""
Management command to populate default Year and Department choices
"""
from django.core.management.base import BaseCommand
from users.dynamic_choices_models import Year, Department


class Command(BaseCommand):
    help = 'Populate default Year and Department choices'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before populating',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            Year.objects.all().delete()
            Department.objects.all().delete()
            self.stdout.write(self.style.WARNING('✓ Cleared existing data'))
        
        self.stdout.write('Populating default choices...')
        
        # Populate Years
        Year.populate_defaults()
        year_count = Year.objects.count()
        self.stdout.write(self.style.SUCCESS(f'✓ Total {year_count} year choices'))
        
        # Populate Departments
        Department.populate_defaults()
        dept_count = Department.objects.count()
        self.stdout.write(self.style.SUCCESS(f'✓ Total {dept_count} department choices'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Default choices populated successfully!'))
        self.stdout.write('You can now manage these choices from the Django admin panel.')
        self.stdout.write('\nAPI Endpoints:')
        self.stdout.write('  - GET /api/users/choices/years/')
        self.stdout.write('  - GET /api/users/choices/departments/')
        self.stdout.write('  - GET /api/users/choices/departments/?category=UG')
