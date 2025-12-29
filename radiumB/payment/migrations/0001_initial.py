# Generated manually for payment app

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('event', '0002_event_gateway_credentials_event_gateway_options'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PaymentConfiguration',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('app_id', models.CharField(help_text='Cashfree App ID', max_length=100)),
                ('secret_key', models.CharField(help_text='Cashfree Secret Key', max_length=200)),
                ('environment', models.CharField(choices=[('TEST', 'Test'), ('PROD', 'Production')], default='TEST', help_text='Environment (TEST/PROD)', max_length=10)),
                ('webhook_secret', models.CharField(blank=True, help_text='Webhook secret for signature verification', max_length=200)),
                ('return_url', models.URLField(blank=True, help_text='Return URL after payment')),
                ('notify_url', models.URLField(help_text='Webhook notification URL')),
                ('is_active', models.BooleanField(default=True, help_text='Whether this configuration is active')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Payment Configuration',
                'verbose_name_plural': 'Payment Configurations',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('order_id', models.CharField(help_text='Cashfree order ID', max_length=100, unique=True)),
                ('cf_order_id', models.CharField(blank=True, help_text='Cashfree order ID from API', max_length=100)),
                ('amount', models.DecimalField(decimal_places=2, help_text='Payment amount in INR', max_digits=10)),
                ('currency', models.CharField(default='INR', max_length=3)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('success', 'Success'), ('failed', 'Failed'), ('cancelled', 'Cancelled'), ('refunded', 'Refunded')], default='pending', max_length=20)),
                ('payment_method', models.CharField(blank=True, choices=[('card', 'Credit/Debit Card'), ('netbanking', 'Net Banking'), ('upi', 'UPI'), ('wallet', 'Wallet'), ('paylater', 'Pay Later')], max_length=20)),
                ('gateway', models.CharField(default='cashfree', help_text='Payment gateway used (cashfree/payu)', max_length=20)),
                ('gateway_credentials', models.JSONField(blank=True, help_text='Gateway credentials used for this payment', null=True)),
                ('cf_payment_id', models.CharField(blank=True, help_text='Cashfree payment ID', max_length=100)),
                ('cf_token', models.TextField(blank=True, help_text='Cashfree payment token')),
                ('payment_session_id', models.CharField(blank=True, help_text='Cashfree payment session ID', max_length=200)),
                ('customer_details', models.JSONField(default=dict, help_text='Customer details from Cashfree')),
                ('payment_details', models.JSONField(default=dict, help_text='Payment details from Cashfree')),
                ('webhook_data', models.JSONField(default=dict, help_text='Webhook data from Cashfree')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('paid_at', models.DateTimeField(blank=True, help_text='When payment was completed', null=True)),
                ('event', models.ForeignKey(help_text='Event for which payment is being made', on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='event.event')),
                ('participant', models.OneToOneField(blank=True, help_text='Participant registration linking user to event', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='payment', to='event.participant')),
                ('user', models.ForeignKey(help_text='User making the payment', on_delete=django.db.models.deletion.CASCADE, related_name='payments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Payment',
                'verbose_name_plural': 'Payments',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PaymentWebhook',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('webhook_type', models.CharField(choices=[('payment_success', 'Payment Success'), ('payment_failed', 'Payment Failed'), ('order_created', 'Order Created'), ('order_failed', 'Order Failed')], max_length=20)),
                ('payload', models.JSONField(help_text='Raw webhook payload')),
                ('signature', models.TextField(blank=True, help_text='Webhook signature for verification')),
                ('is_verified', models.BooleanField(default=False, help_text='Whether webhook signature was verified')),
                ('processed', models.BooleanField(default=False, help_text='Whether webhook was processed')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('payment', models.ForeignKey(blank=True, help_text='Associated payment', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='webhooks', to='payment.payment')),
            ],
            options={
                'verbose_name': 'Payment Webhook',
                'verbose_name_plural': 'Payment Webhooks',
                'ordering': ['-created_at'],
            },
        ),
    ]