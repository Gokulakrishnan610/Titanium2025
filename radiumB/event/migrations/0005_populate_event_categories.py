# Generated manually to populate EventCategory model

from django.db import migrations


def populate_event_categories(apps, schema_editor):
    """Populate EventCategory model with default values"""
    EventCategory = apps.get_model('event', 'EventCategory')
    
    # Create default categories
    default_categories = [
        ('workshop', 'Workshop', 'Hands-on learning sessions', 1),
        ('seminar', 'Seminar', 'Educational presentations and talks', 2),
        ('competition', 'Competition', 'Competitive events and contests', 3),
        ('hackathon', 'Hackathon', 'Coding competitions and innovation challenges', 4),
        ('meetup', 'Meetup', 'Networking and community gatherings', 5),
        ('conference', 'Conference', 'Large-scale professional events', 6),
        ('other', 'Other', 'Miscellaneous events', 7),
    ]
    
    for code, display_name, description, order in default_categories:
        EventCategory.objects.get_or_create(
            code=code,
            defaults={
                'display_name': display_name,
                'description': description,
                'order': order,
                'is_active': True
            }
        )


def reverse_populate_event_categories(apps, schema_editor):
    """Reverse the population (for rollback)"""
    EventCategory = apps.get_model('event', 'EventCategory')
    EventCategory.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0004_create_event_category_model'),
    ]

    operations = [
        migrations.RunPython(
            populate_event_categories,
            reverse_populate_event_categories
        ),
    ]