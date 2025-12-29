"""
Management command to populate default Year, Category, and Department choices
"""
from django.core.management.base import BaseCommand
from users.dynamic_choices_models import Year, Department, Category


class Command(BaseCommand):
    help = 'Populate default Year, Category, and Department choices'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before populating',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            Department.objects.all().delete()  # Delete departments first due to foreign key
            Category.objects.all().delete()
            Year.objects.all().delete()
            self.stdout.write(self.style.WARNING('✓ Cleared existing data'))
        
        self.stdout.write('Populating default choices...')
        
        # Populate Categories first (required for departments)
        Category.populate_defaults()
        category_count = Category.objects.count()
        self.stdout.write(self.style.SUCCESS(f'✓ Total {category_count} category choices'))
        
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
        self.stdout.write('  - GET /api/users/choices/categories/')
        self.stdout.write('  - GET /api/users/choices/departments/')
        self.stdout.write('  - GET /api/users/choices/departments/?category=UG')
