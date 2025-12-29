# Generated manually to move Year and Department models to academic app

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0019_merge_20251108_1351'),
    ]

    operations = [
        # Just mark the models as deleted from users app
        # The tables will remain in the database and be managed by academic app
        migrations.DeleteModel(
            name='Department',
        ),
        migrations.DeleteModel(
            name='Year',
        ),
    ]
