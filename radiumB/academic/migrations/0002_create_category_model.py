# Generated manually to create Category model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academic', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(help_text="Category code (e.g., 'UG', 'PG', 'PhD')", max_length=10, unique=True)),
                ('display_name', models.CharField(help_text="Display name (e.g., 'Undergraduate', 'Postgraduate')", max_length=50)),
                ('is_active', models.BooleanField(default=True, help_text='Whether this category is currently active')),
                ('order', models.IntegerField(default=0, help_text='Display order (lower numbers appear first)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Category',
                'verbose_name_plural': 'Categories',
                'ordering': ['order', 'code'],
            },
        ),
    ]