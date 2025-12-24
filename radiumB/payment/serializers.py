from rest_framework import serializers
from .models import Payment, PaymentWebhook, PaymentConfiguration
from django.contrib.auth import get_user_model

User = get_user_model()


class PaymentConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for PaymentConfiguration model"""

    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = PaymentConfiguration
        fields = [
            'id', 'app_id', 'secret_key', 'environment', 'webhook_secret',
            'return_url', 'notify_url', 'is_active', 'created_at',
            'updated_at', 'updated_by', 'updated_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'updated_by', 'updated_by_name']
        extra_kwargs = {
            'secret_key': {'write_only': True},  # Hide secret key in responses
            'webhook_secret': {'write_only': True},  # Hide webhook secret in responses
        }


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""

    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    event_name = serializers.CharField(source='event.event_name', read_only=True)
    event_date = serializers.DateTimeField(source='event.event_date', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'order_id', 'cf_order_id', 'user_name', 'user_email',
            'event_name', 'event_date', 'amount', 'currency', 'status',
            'payment_method', 'cf_payment_id', 'payment_session_id',
            'customer_details', 'payment_details', 'created_at',
            'updated_at', 'paid_at'
        ]
        read_only_fields = [
            'id', 'order_id', 'cf_order_id', 'cf_payment_id',
            'payment_session_id', 'customer_details', 'payment_details',
            'created_at', 'updated_at', 'paid_at'
        ]


class PaymentCreateSerializer(serializers.Serializer):
    """Serializer for creating payment orders"""

    participant_id = serializers.UUIDField(required=True, help_text="Participant ID for the event")

    def validate_participant_id(self, value):
        """Validate that participant exists and payment is needed"""
        try:
            from event.models import Participant
            participant = Participant.objects.select_related('event', 'user').get(id=value)

            # Check if payment already exists for this user-event combination
            existing_payment = Payment.objects.filter(
                user=participant.user,
                event=participant.event
            ).first()

            if existing_payment and existing_payment.is_successful:
                raise serializers.ValidationError("Payment has already been completed for this event.")

            # Check if event requires payment
            if participant.event.payment_type != 'paid':
                raise serializers.ValidationError("This event does not require payment.")

            # Check if event price is set
            if not participant.event.price or participant.event.price <= 0:
                raise serializers.ValidationError("Event price is not configured.")

            return participant

        except Participant.DoesNotExist:
            raise serializers.ValidationError("Participant not found.")


class PaymentStatusSerializer(serializers.Serializer):
    """Serializer for checking payment status"""

    order_id = serializers.CharField(required=True, max_length=100)


class PaymentWebhookSerializer(serializers.ModelSerializer):
    """Serializer for PaymentWebhook model"""

    order_id = serializers.CharField(source='payment.order_id', read_only=True)

    class Meta:
        model = PaymentWebhook
        fields = [
            'id', 'order_id', 'webhook_type', 'payload',
            'is_verified', 'processed', 'created_at'
        ]
        read_only_fields = ['id', 'is_verified', 'processed', 'created_at']


class PaymentInitiateSerializer(serializers.Serializer):
    """Serializer for initiating payment with Cashfree"""

    participant_id = serializers.UUIDField(required=True)
    return_url = serializers.URLField(required=False, help_text="URL to redirect after payment")

    def validate_participant_id(self, value):
        """Validate participant and ensure no duplicate payments for user-event combination"""
        try:
            from event.models import Participant
            participant = Participant.objects.select_related('event', 'user').get(id=value)

            # Check if user is the participant
            request = self.context.get('request')
            if participant.user != request.user:
                raise serializers.ValidationError("You can only initiate payments for your own registrations.")

            # Check if payment already exists for this user-event combination
            existing_payment = Payment.objects.filter(
                user=participant.user,
                event=participant.event
            ).first()

            if existing_payment:
                if existing_payment.is_successful:
                    raise serializers.ValidationError("Payment has already been completed for this event.")
                elif existing_payment.status == 'pending':
                    raise serializers.ValidationError("A payment is already pending for this event. Please complete or cancel the existing payment.")

            # Check if event requires payment
            if participant.event.payment_type != 'paid':
                raise serializers.ValidationError("This event does not require payment.")

            # Check if event price is set
            if not participant.event.price or participant.event.price <= 0:
                raise serializers.ValidationError("Event price is not configured.")

            return participant

        except Participant.DoesNotExist:
            raise serializers.ValidationError("Participant not found.")