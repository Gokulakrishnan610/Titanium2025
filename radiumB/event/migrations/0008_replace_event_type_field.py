# Generated manually to replace the old event_type field with the new foreign key

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0007_populate_event_type_fk'),
    ]

    operations = [
        # Remove the old event_type CharField
        migrations.RemoveField(
            model_name='event',
            name='event_type',
        ),
        # Rename the new event_type_fk field to event_type
        migrations.RenameField(
            model_name='event',
            old_name='event_type_fk',
            new_name='event_type',
        ),
        # Make the event_type field non-nullable
        migrations.AlterField(
            model_name='event',
            name='event_type',
            field=models.ForeignKey(
                help_text='Type of event',
                on_delete=django.db.models.deletion.CASCADE,
                to='event.eventcategory'
            ),
        ),
    ]