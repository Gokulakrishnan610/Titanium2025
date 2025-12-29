# Generated manually to add new event_type foreign key field

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0005_populate_event_categories'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='event_type_fk',
            field=models.ForeignKey(
                help_text='Type of event',
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                to='event.eventcategory'
            ),
        ),
    ]