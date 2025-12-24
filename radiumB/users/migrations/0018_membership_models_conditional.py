# Generated manually to handle membership models with conditional table creation

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


def create_membership_tables_forward(apps, schema_editor):
    """
    Create membership-related tables if they don't exist
    """
    from django.db import connection

    # Check if PremiumMembershipSlot table exists
    if not schema_editor.connection.introspection.table_names():
        schema_editor.connection.introspection.get_table_list(schema_editor.connection.cursor())

    tables = schema_editor.connection.introspection.table_names()

    # Create PremiumMembershipSlot table if it doesn't exist
    if 'users_premiummembershipslot' not in tables:
        schema_editor.create_model(
            apps.get_model('users', 'PremiumMembershipSlot')
        )

    # Create DevsMembership table if it doesn't exist
    if 'users_devsmembership' not in tables:
        schema_editor.create_model(
            apps.get_model('users', 'DevsMembership')
        )

    # Create PremiumMembershipApplication table if it doesn't exist
    if 'users_premiummembershipapplication' not in tables:
        schema_editor.create_model(
            apps.get_model('users', 'PremiumMembershipApplication')
        )


def create_membership_tables_reverse(apps, schema_editor):
    """
    Remove membership-related tables
    """
    schema_editor.delete_model(apps.get_model('users', 'PremiumMembershipApplication'))
    schema_editor.delete_model(apps.get_model('users', 'DevsMembership'))
    schema_editor.delete_model(apps.get_model('users', 'PremiumMembershipSlot'))


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_remove_userprofile_is_staff_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PremiumMembershipSlot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text="Slot batch name (e.g., 'Batch 1 - November 2025')", max_length=100)),
                ('description', models.TextField(blank=True, help_text='Description of this premium slot batch')),
                ('total_slots', models.PositiveIntegerField(help_text='Total number of premium slots available')),
                ('is_open', models.BooleanField(default=False, help_text='Whether this slot is currently open for applications')),
                ('opens_at', models.DateTimeField(blank=True, help_text='When this slot opens', null=True)),
                ('closes_at', models.DateTimeField(blank=True, help_text='When this slot closes', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Premium Membership Slot',
                'verbose_name_plural': 'Premium Membership Slots',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='year',
            field=models.CharField(blank=True, choices=[('2026', 'Graduating 2026'), ('2027', 'Graduating 2027'), ('2028', 'Graduating 2028'), ('2029', 'Graduating 2029'), ('2030', 'Graduating 2030'), ('2031', 'Graduating 2031'), ('PhD', 'Ph.D. (Ongoing)')], help_text='Expected graduation year', max_length=20),
        ),
        migrations.CreateModel(
            name='DevsMembership',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('membership_type', models.CharField(choices=[('basic', 'Basic DEVS Membership'), ('premium', 'Premium DEVS Membership')], default='basic', max_length=10)),
                ('status', models.CharField(choices=[('active', 'Active'), ('expired', 'Expired'), ('suspended', 'Suspended')], default='active', max_length=10)),
                ('claimed_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField(blank=True, null=True)),
                ('premium_upgraded_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='devs_membership', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'DEVS Membership',
                'verbose_name_plural': 'DEVS Memberships',
                'ordering': ['-claimed_at'],
            },
        ),
        migrations.CreateModel(
            name='PremiumMembershipApplication',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('pending', 'Pending Review'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('waitlist', 'Waitlisted')], default='pending', max_length=10)),
                ('application_reason', models.TextField(help_text='Why do you want premium membership?')),
                ('applied_at', models.DateTimeField(auto_now_add=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('review_notes', models.TextField(blank=True, help_text='Admin notes about the application')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_premium_applications', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='premium_applications', to=settings.AUTH_USER_MODEL)),
                ('slot', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='applications', to='users.premiummembershipslot')),
            ],
            options={
                'verbose_name': 'Premium Membership Application',
                'verbose_name_plural': 'Premium Membership Applications',
                'ordering': ['-applied_at'],
                'unique_together': {('user', 'slot')},
            },
        ),
    ]