# Generated manually to populate Category model

from django.db import migrations


def populate_categories(apps, schema_editor):
    """Populate Category model with default values"""
    Category = apps.get_model('academic', 'Category')
    
    # Create default categories
    categories = [
        ('UG', 'Undergraduate', 1),
        ('PG', 'Postgraduate', 2),
        ('PhD', 'Doctoral', 3),
    ]
    
    for code, display_name, order in categories:
        Category.objects.get_or_create(
            code=code,
            defaults={
                'display_name': display_name,
                'order': order,
                'is_active': True
            }
        )


def reverse_populate_categories(apps, schema_editor):
    """Reverse the population (for rollback)"""
    Category = apps.get_model('academic', 'Category')
    Category.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('academic', '0002_create_category_model'),
    ]

    operations = [
        migrations.RunPython(
            populate_categories,
            reverse_populate_categories
        ),
    ]