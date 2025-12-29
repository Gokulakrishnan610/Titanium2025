# Generated manually to populate the new event_type_fk field

from django.db import migrations


def populate_event_type_fk(apps, schema_editor):
    """Populate the new event_type_fk field based on existing event_type values"""
    EventCategory = apps.get_model('event', 'EventCategory')
    Event = apps.get_model('event', 'Event')
    
    # Create a mapping from old event type codes to EventCategory objects
    category_mapping = {}
    for category in EventCategory.objects.all():
        category_mapping[category.code] = category
    
    # Update all events
    for event in Event.objects.all():
        old_event_type_code = event.event_type  # This is the old CharField value
        if old_event_type_code in category_mapping:
            event.event_type_fk = category_mapping[old_event_type_code]
            event.save()
        else:
            # If the old event type doesn't match any category, use 'other'
            if 'other' in category_mapping:
                event.event_type_fk = category_mapping['other']
                event.save()


def reverse_populate_event_type_fk(apps, schema_editor):
    """Reverse the population (for rollback)"""
    Event = apps.get_model('event', 'Event')
    Event.objects.update(event_type_fk=None)


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0006_add_event_type_fk_field'),
    ]

    operations = [
        migrations.RunPython(
            populate_event_type_fk,
            reverse_populate_event_type_fk
        ),
    ]