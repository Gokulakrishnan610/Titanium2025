# Generated manually to add new category foreign key field

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academic', '0003_populate_categories'),
    ]

    operations = [
        migrations.AddField(
            model_name='department',
            name='category_fk',
            field=models.ForeignKey(
                help_text='Department category',
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                to='academic.category'
            ),
        ),
    ]