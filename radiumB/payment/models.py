from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from event.models import Event, Participant
import uuid

User = get_user_model()


class PaymentConfiguration(models.Model):
    """Dynamic payment gateway configuration"""

    ENVIRONMENT_CHOICES = [
        ('TEST', 'Test Environment'),
        ('PRODUCTION', 'Production Environment'),
    ]

    # Configuration fields
    app_id = models.CharField(max_length=100, help_text="Cashfree App ID")
    secret_key = models.CharField(max_length=200, help_text="Cashfree Secret Key")
    environment = models.CharField(
        max_length=20,
        choices=ENVIRONMENT_CHOICES,
        default='TEST',
        help_text="Cashfree environment"
    )
    webhook_secret = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Webhook secret for signature verification"
    )
    return_url = models.URLField(
        default='http://localhost:3000/payment/success',
        help_text="URL to redirect after payment completion"
    )
    notify_url = models.URLField(
        default='https://domain.com/api/payment/webhook/',
        help_text="Webhook URL for payment notifications"
    )

    # Metadata
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this configuration is currently active"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payment_config_updates',
        help_text="User who last updated this configuration"
    )

    class Meta:
        verbose_name = "Payment Configuration"
        verbose_name_plural = "Payment Configurations"
        ordering = ['-updated_at']

    def __str__(self):
        return f"Cashfree Config ({self.environment}) - {self.app_id[:10]}..."

    def save(self, *args, **kwargs):
        # Ensure only one active configuration
        if self.is_active:
            PaymentConfiguration.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)

    @classmethod
    def get_active_config(cls):
        """Get the currently active payment configuration"""
        return cls.objects.filter(is_active=True).first()


class Payment(models.Model):
    """Payment transaction model for Cashfree integration"""

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('card', 'Credit/Debit Card'),
        ('netbanking', 'Net Banking'),
        ('upi', 'UPI'),
        ('wallet', 'Wallet'),
        ('paylater', 'Pay Later'),
    ]

    # Primary identifiers
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_id = models.CharField(max_length=100, unique=True, help_text="Cashfree order ID")
    cf_order_id = models.CharField(max_length=100, blank=True, help_text="Cashfree order ID from API")

    # Relationships - Each payment is linked to a specific user for a specific event
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payments',
        help_text="User making the payment"
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='payments',
        help_text="Event for which payment is being made"
    )
    participant = models.OneToOneField(
        Participant,
        on_delete=models.CASCADE,
        related_name='payment',
        help_text="Participant registration linking user to event",
        null=True,
        blank=True
    )

    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Payment amount in INR")
    currency = models.CharField(max_length=3, default='INR')

    # Status and method
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True)
    
    # Gateway information
    gateway = models.CharField(max_length=20, default='cashfree', help_text="Payment gateway used (cashfree/payu)")
    gateway_credentials = models.JSONField(null=True, blank=True, help_text="Gateway credentials used for this payment")

    # Cashfree specific fields
    cf_payment_id = models.CharField(max_length=100, blank=True, help_text="Cashfree payment ID")
    cf_token = models.TextField(blank=True, help_text="Cashfree payment token")
    payment_session_id = models.CharField(max_length=200, blank=True, help_text="Cashfree payment session ID")

    # Additional metadata
    customer_details = models.JSONField(default=dict, help_text="Customer details from Cashfree")
    payment_details = models.JSONField(default=dict, help_text="Payment details from Cashfree")
    webhook_data = models.JSONField(default=dict, help_text="Webhook data from Cashfree")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True, help_text="When payment was completed")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        # Ensure one payment per user per event
        unique_together = ['user', 'event']
        indexes = [
            models.Index(fields=['order_id']),
            models.Index(fields=['cf_order_id']),
            models.Index(fields=['status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'event']),
        ]

    def __str__(self):
        return f"Payment {self.order_id} - {self.user.username} - {self.amount} INR"

    @property
    def is_successful(self):
        """Check if payment is successful"""
        return self.status == 'success'

    @property
    def is_pending(self):
        """Check if payment is pending"""
        return self.status == 'pending'

    def mark_as_successful(self, cf_payment_id=None, payment_details=None):
        """Mark payment as successful"""
        self.status = 'success'
        self.paid_at = timezone.now()
        if cf_payment_id:
            self.cf_payment_id = cf_payment_id
        if payment_details:
            self.payment_details = payment_details
        self.save(update_fields=['status', 'paid_at', 'cf_payment_id', 'payment_details', 'updated_at'])

        # Update participant's payment status if participant exists
        if self.participant:
            self.participant.payment_status = True
            self.participant.save(update_fields=['payment_status'])

    def mark_as_failed(self, payment_details=None):
        """Mark payment as failed"""
        self.status = 'failed'
        if payment_details:
            self.payment_details = payment_details
        self.save(update_fields=['status', 'payment_details', 'updated_at'])

    def mark_as_cancelled(self, payment_details=None):
        """Mark payment as cancelled"""
        self.status = 'cancelled'
        if payment_details:
            self.payment_details = payment_details
        self.save(update_fields=['status', 'payment_details', 'updated_at'])


class PaymentWebhook(models.Model):
    """Store payment webhooks for audit and debugging"""

    WEBHOOK_TYPE_CHOICES = [
        ('payment_success', 'Payment Success'),
        ('payment_failed', 'Payment Failed'),
        ('order_created', 'Order Created'),
        ('order_failed', 'Order Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='webhooks', null=True, blank=True)

    webhook_type = models.CharField(max_length=20, choices=WEBHOOK_TYPE_CHOICES)
    payload = models.JSONField(help_text="Raw webhook payload")
    signature = models.TextField(blank=True, help_text="Webhook signature for verification")

    is_verified = models.BooleanField(default=False, help_text="Whether webhook signature was verified")
    processed = models.BooleanField(default=False, help_text="Whether webhook was processed")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Payment Webhook"
        verbose_name_plural = "Payment Webhooks"

    def __str__(self):
        return f"Webhook {self.webhook_type} - {self.payment.order_id}"
