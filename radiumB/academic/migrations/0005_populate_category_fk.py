# Generated manually to populate the new category foreign key field

from django.db import migrations


def populate_category_fk(apps, schema_editor):
    """Populate the new category_fk field based on existing category values"""
    Category = apps.get_model('academic', 'Category')
    Department = apps.get_model('academic', 'Department')
    
    # Create a mapping from old category codes to Category objects
    category_mapping = {}
    for category in Category.objects.all():
        category_mapping[category.code] = category
    
    # Update all departments
    for dept in Department.objects.all():
        old_category_code = dept.category  # This is the old CharField value
        if old_category_code in category_mapping:
            dept.category_fk = category_mapping[old_category_code]
            dept.save()


def reverse_populate_category_fk(apps, schema_editor):
    """Reverse the population (for rollback)"""
    Department = apps.get_model('academic', 'Department')
    Department.objects.update(category_fk=None)


class Migration(migrations.Migration):

    dependencies = [
        ('academic', '0004_add_category_fk_field'),
    ]

    operations = [
        migrations.RunPython(
            populate_category_fk,
            reverse_populate_category_fk
        ),
    ]