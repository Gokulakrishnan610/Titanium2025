# Generated manually to replace the old category field with the new foreign key

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academic', '0005_populate_category_fk'),
    ]

    operations = [
        # Remove the old category CharField
        migrations.RemoveField(
            model_name='department',
            name='category',
        ),
        # Rename the new category_fk field to category
        migrations.RenameField(
            model_name='department',
            old_name='category_fk',
            new_name='category',
        ),
        # Make the category field non-nullable
        migrations.AlterField(
            model_name='department',
            name='category',
            field=models.ForeignKey(
                help_text='Department category',
                on_delete=django.db.models.deletion.CASCADE,
                to='academic.category'
            ),
        ),
        # Update the model meta options
        migrations.AlterModelOptions(
            name='department',
            options={
                'ordering': ['category__order', 'order', 'code'],
                'verbose_name': 'Department',
                'verbose_name_plural': 'Departments'
            },
        ),
    ]