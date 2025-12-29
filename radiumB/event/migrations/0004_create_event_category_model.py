# Generated manually to create EventCategory model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0003_event_event_mode_event_meeting_url'),
    ]

    operations = [
        migrations.CreateModel(
            name='EventCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(help_text="Category code (e.g., 'workshop', 'seminar')", max_length=20, unique=True)),
                ('display_name', models.CharField(help_text="Display name (e.g., 'Workshop', 'Seminar')", max_length=50)),
                ('description', models.TextField(blank=True, help_text='Optional description of the category')),
                ('is_active', models.BooleanField(default=True, help_text='Whether this category is currently active')),
                ('order', models.IntegerField(default=0, help_text='Display order (lower numbers appear first)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Event Category',
                'verbose_name_plural': 'Event Categories',
                'ordering': ['order', 'code'],
            },
        ),
    ]