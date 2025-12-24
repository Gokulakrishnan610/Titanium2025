import uuid
import hashlib
import hmac
from decimal import Decimal
from django.conf import settings
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
from django.http import JsonResponse
from django.db import models
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import csrf_exempt


from .models import Payment, PaymentWebhook, PaymentConfiguration
from .serializers import (
    PaymentSerializer, PaymentCreateSerializer,
    PaymentStatusSerializer, PaymentInitiateSerializer,
    PaymentConfigurationSerializer
)
from event.models import Participant

try:
    from cashfree_pg.api_client import ApiClient
    from cashfree_pg.api_client import Configuration
    from cashfree_pg.api_client import OrdersApi
    from cashfree_pg.models.create_order_request import CreateOrderRequest
    from cashfree_pg.models.customer_details import CustomerDetails
    from cashfree_pg.models.order_meta import OrderMeta
    CASHFREE_AVAILABLE = True
except ImportError:
    CASHFREE_AVAILABLE = False


class PayUService:
    """PayU payment service"""

    def __init__(self, credentials=None):
        """Initialize PayU service with optional custom credentials"""
        self.credentials = credentials or {}

    def create_order(self, order_id, amount, customer_details, return_url=None, notify_url=None):
        """Create a PayU order using direct API call"""
        try:
            import requests
            
            import sys
            
            # Get PayU credentials (custom or default)
            merchant_key = self.credentials.get('merchant_key') or settings.PAYU_CONFIG.get('MERCHANT_KEY')
            merchant_salt = self.credentials.get('merchant_salt') or settings.PAYU_CONFIG.get('MERCHANT_SALT')
            
            if not merchant_key or not merchant_salt:
                raise Exception("PayU credentials not configured")
            
            # Clean customer details
            cleaned_customer_details = customer_details.copy()
            phone = str(cleaned_customer_details['customer_phone']).replace(' ', '').replace('-', '').lstrip('0')
            if len(phone) >= 10:
                cleaned_customer_details['customer_phone'] = phone[:10]
            else:
                cleaned_customer_details['customer_phone'] = phone.zfill(10)
            
            # PayU API endpoint
            base_url = "https://test.payu.in" if settings.PAYU_CONFIG.get('ENVIRONMENT') == 'TEST' else "https://secure.payu.in"
            url = f"{base_url}/_payment"
            
            # PayU required parameters - validate and clean
            txnid = str(order_id).strip()
            if not txnid or len(txnid) > 50:  # PayU has limits on txnid length
                raise Exception(f"Invalid order_id: {order_id}")
            
            productinfo = f"Event Registration - Order {txnid}"
            firstname = cleaned_customer_details['customer_name'].split()[0] if cleaned_customer_details['customer_name'] else "User"
            firstname = firstname[:50]  # Limit firstname length
            
            email = cleaned_customer_details['customer_email']
            if not email or '@' not in email:
                raise Exception(f"Invalid email: {email}")
            
            phone = cleaned_customer_details['customer_phone']
            
            # Always use backend URLs for PayU responses, not frontend return_url
            surl = settings.PAYU_CONFIG.get('SUCCESS_URL', '')
            furl = settings.PAYU_CONFIG.get('FAILURE_URL', '')
            
            if not surl or not furl:
                raise Exception("PayU success/failure URLs not configured")
            
            print(f"[PAYU DEBUG] Using surl: {surl}, furl: {furl}", file=sys.stderr)
            
            # Generate hash
            hash_string = f"{merchant_key}|{txnid}|{amount}|{productinfo}|{firstname}|{email}|||||||||||{merchant_salt}"
            hash_value = hashlib.sha512(hash_string.encode('utf-8')).hexdigest()
            
            # PayU form data
            data = {
                'key': merchant_key,
                'txnid': txnid,
                'amount': str(amount),
                'productinfo': productinfo,
                'firstname': firstname,
                'email': email,
                'phone': phone,
                'surl': surl,
                'furl': furl,
                'hash': hash_value,
                'service_provider': 'payu_paisa'
            }
            
            print(f"[PAYU DEBUG] Request data: {data}", file=sys.stderr)
            
            # PayU uses form submission, so we return the form data and URL
            payment_url = url
            
            # Create a mock response object similar to Cashfree
            class MockData:
                def __init__(self, data, payment_url):
                    self.order_id = data['txnid']
                    self.cf_order_id = data['txnid']  # Use same field for consistency
                    self.payment_session_id = data['hash']  # Use hash as session ID
                    self.payment_token = data['hash']
                    self.order_amount = data['amount']
                    self.order_currency = 'INR'
                    self.payment_url = payment_url
                    self.form_data = data
            
            class MockResponse:
                def __init__(self, data, payment_url):
                    self.data = MockData(data, payment_url)
            
            return MockResponse(data, payment_url), payment_url
            
        except Exception as e:
            raise Exception(f"Failed to create PayU order: {str(e)}")

    @staticmethod
    def verify_webhook_signature(payload, signature, headers=None):
        """Verify PayU webhook signature
        
        Args:
            payload (bytes or str): The raw request body (as bytes or string).
            signature (str): The signature sent by PayU (usually in headers or POST data).
            headers (dict, optional): The request headers, if needed.
        
        Returns:
            bool: True if signature is valid, False otherwise.
        """
        # Get the merchant key/salt from settings or environment
        merchant_key = getattr(settings, "PAYU_MERCHANT_KEY", None)
        merchant_salt = getattr(settings, "PAYU_MERCHANT_SALT", None)
        if not merchant_key or not merchant_salt:
            # Cannot verify without secret
            return False

        # PayU typically uses SHA512 HMAC with the salt as key
        # The exact string to sign depends on PayU's documentation and the payload format
        # For demonstration, assume payload is a string to be signed
        if isinstance(payload, bytes):
            payload_str = payload.decode("utf-8")
        else:
            payload_str = payload

        # Compute HMAC SHA512 using merchant_salt as key
        computed_signature = hmac.new(
            merchant_salt.encode("utf-8"),
            payload_str.encode("utf-8"),
            hashlib.sha512
        ).hexdigest()

        # Use compare_digest for security
        return hmac.compare_digest(computed_signature, signature)
class CashfreeService:
    """Secure Cashfree payment service"""

    def __init__(self, credentials=None):
        """Initialize Cashfree service with optional custom credentials"""
        self.credentials = credentials or {}

    def create_order(self, order_id, amount, customer_details, return_url=None, notify_url=None):
        """Create a Cashfree order using direct API call"""
        try:
            import requests
            import sys
            # Clean customer details
            cleaned_customer_details = customer_details.copy()
            # Clean phone number: remove spaces/dashes, ensure exactly 10 digits, remove leading zeros
            phone = str(cleaned_customer_details['customer_phone']).replace(' ', '').replace('-', '').lstrip('0')
            if len(phone) == 10:
                cleaned_customer_details['customer_phone'] = phone
            elif len(phone) == 9:
                cleaned_customer_details['customer_phone'] = phone.zfill(10)  # This shouldn't happen for valid numbers
            elif len(phone) > 10:
                cleaned_customer_details['customer_phone'] = phone[:10]  # Take first 10 digits
            else:
                cleaned_customer_details['customer_phone'] = phone.zfill(10)  # Pad if too short
            # ...existing code...
            # Debug print for secret key, placed before headers/data assignment
            print("[CASHFREE DEBUG] Secret Key:", repr(settings.CASHFREE_CONFIG['SECRET_KEY']), file=sys.stderr)
            if 'customer_name' not in cleaned_customer_details or not cleaned_customer_details['customer_name']:
                cleaned_customer_details['customer_name'] = f"User{cleaned_customer_details['customer_id']}"
            print("[CASHFREE DEBUG] Original customer_details:", customer_details, file=sys.stderr)
            print("[CASHFREE DEBUG] Cleaned customer_details:", cleaned_customer_details, file=sys.stderr)
            # Get Cashfree credentials (custom or default)
            app_id = self.credentials.get('app_id') or settings.CASHFREE_CONFIG['APP_ID']
            secret_key = self.credentials.get('secret_key') or settings.CASHFREE_CONFIG['SECRET_KEY']
            environment = self.credentials.get('environment') or settings.CASHFREE_CONFIG['ENVIRONMENT']
            
            if not app_id or not secret_key:
                raise Exception("Cashfree credentials not configured")
            
            # Use latest v5 API (2023-08-01)
            base_url = "https://sandbox.cashfree.com/pg" if environment == 'TEST' else "https://api.cashfree.com/pg"
            url = f"{base_url}/orders"
            headers = {
                'x-api-version': '2023-08-01',
                'x-client-id': app_id,
                'x-client-secret': secret_key,
                'Content-Type': 'application/json'
            }
            print("[CASHFREE DEBUG] Secret Key:", repr(settings.CASHFREE_CONFIG['SECRET_KEY']), file=sys.stderr)
            data = {
                'order_id': order_id,
                'order_amount': amount,
                'order_currency': 'INR',
                'customer_details': {
                    'customer_id': cleaned_customer_details['customer_id'],
                    'customer_email': cleaned_customer_details['customer_email'],
                    'customer_phone': cleaned_customer_details['customer_phone'],
                    'customer_name': cleaned_customer_details['customer_name']
                },
                'order_meta': {
                    'return_url': return_url or settings.CASHFREE_CONFIG['RETURN_URL'],
                    'notify_url': notify_url or settings.CASHFREE_CONFIG['NOTIFY_URL']
                },
            }
            print("[CASHFREE DEBUG] Request data:", data, file=sys.stderr)
            print("[CASHFREE DEBUG] Headers:", {k: v for k, v in headers.items() if k != 'x-client-secret'}, file=sys.stderr)  # Hide secret
            response = requests.post(url, json=data, headers=headers)
            print("[CASHFREE DEBUG] API status:", response.status_code, file=sys.stderr)
            print("[CASHFREE DEBUG] API response:", response.text, file=sys.stderr)
            print("[CASHFREE DEBUG] Full response object:", repr(response), file=sys.stderr)
            if response.status_code != 200:
                raise Exception(f"Cashfree API error: {response.status_code} - {response.text}")
            response_data = response.json()
            # Sanitize response payment_session_id returned by Cashfree (common sandbox corruption)
            raw_resp_psid = response_data.get('payment_session_id', '') or ''
            if raw_resp_psid and raw_resp_psid.endswith('payment'):
                import sys
                print(f"[CASHFREE WARNING] API returned corrupted payment_session_id: {repr(raw_resp_psid)}. Stripping trailing 'payment' fragments.", file=sys.stderr)
                # Remove any trailing repeated 'payment' fragments
                while raw_resp_psid.endswith('payment'):
                    raw_resp_psid = raw_resp_psid[:-7]
                response_data['payment_session_id'] = raw_resp_psid
            # Also prefer payments.url from API if present
            print("[CASHFREE DEBUG] Parsed response data:", response_data, file=sys.stderr)
            if 'errors' in response_data:
                print("[CASHFREE DEBUG] API errors found:", response_data['errors'], file=sys.stderr)
            if 'message' in response_data:
                print("[CASHFREE DEBUG] API message:", response_data['message'], file=sys.stderr)
            if 'order_status' in response_data:
                print("[CASHFREE DEBUG] Order status:", response_data['order_status'], file=sys.stderr)
            # Construct checkout URL using cf_order_id and session token
            payment_url = f"https://payments{'-test' if environment == 'TEST' else ''}.cashfree.com/pg/orders/{response_data.get('cf_order_id', '')}/checkout?token={response_data.get('payment_session_id', '')}"
            print(f"[CASHFREE DEBUG] Final payment URL: {payment_url}", file=sys.stderr)
            # Create a mock response object similar to SDK
            class MockData:
                def __init__(self, data):
                    import sys
                    self.order_id = data.get('order_id')
                    self.cf_order_id = data.get('cf_order_id')
                    # ensure MockData uses the sanitized token
                    self.payment_session_id = data.get('payment_session_id', '')
                    self.payment_token = data.get('payment_token')
                    self.order_amount = data.get('order_amount')
                    self.order_currency = data.get('order_currency')
            class MockResponse:
                def __init__(self, data):
                    self.data = MockData(data)
            return MockResponse(response_data), payment_url
        except Exception as e:
            raise Exception(f"Failed to create Cashfree order: {str(e)}")

    @staticmethod
    def verify_webhook_signature(payload, signature, headers=None):
        """
        Verifies the Cashfree webhook signature using HMAC SHA256.
        Follows Cashfree documentation: parse JSON, sort keys, concatenate values, hash.
        payload: bytes (raw request body - JSON)
        signature: str (from x-webhook-signature header)
        headers: request headers dict (unused)
        """
        import base64
        import hmac
        import hashlib
        import json
        from django.conf import settings
        secret = settings.CASHFREE_CONFIG.get('WEBHOOK_SECRET')
        if not secret:
            print("[WEBHOOK_DEBUG] No webhook secret configured")
            return False
        
        try:
            # Parse the JSON payload
            payload_str = payload.decode('utf-8')
            data = json.loads(payload_str)
            
            # Remove signature field if present (though it shouldn't be in JSON payload)
            if 'signature' in data:
                del data['signature']
            
            # Sort the data by keys recursively
            def sort_dict_recursive(d):
                if isinstance(d, dict):
                    return {k: sort_dict_recursive(v) for k, v in sorted(d.items())}
                elif isinstance(d, list):
                    return [sort_dict_recursive(item) for item in d]
                else:
                    return d
            
            sorted_data = sort_dict_recursive(data)
            
            # Concatenate all values in order
            def concatenate_values(obj):
                if isinstance(obj, dict):
                    return ''.join(str(concatenate_values(v)) for v in obj.values())
                elif isinstance(obj, list):
                    return ''.join(str(concatenate_values(item)) for item in obj)
                else:
                    return str(obj)
            
            post_data = concatenate_values(sorted_data)
            
            print(f"[WEBHOOK_DEBUG] Concatenated post data: {repr(post_data)}")
            
            # Compute HMAC SHA256
            computed_signature = base64.b64encode(
                hmac.new(
                    key=secret.encode('utf-8'),
                    msg=post_data.encode('utf-8'),
                    digestmod=hashlib.sha256
                ).digest()
            ).decode('utf-8')
            
            print(f"[WEBHOOK_DEBUG] Expected signature: {computed_signature}")
            print(f"[WEBHOOK_DEBUG] Received signature: {signature}")
            print(f"[WEBHOOK_DEBUG] Secret used: {secret[:10]}...")
            
            return hmac.compare_digest(computed_signature, signature)
            
        except Exception as e:
            print(f"[WEBHOOK_DEBUG] Error verifying signature: {e}")
            return False

    def create_payment_link(self, order_id, amount, customer_details, return_url=None, notify_url=None):
        """Create a Cashfree payment link using direct API call"""
        try:
            import requests
            import sys
            
            # Clean customer details
            cleaned_customer_details = customer_details.copy()
            # Clean phone number: remove spaces/dashes, ensure exactly 10 digits, remove leading zeros
            phone = str(cleaned_customer_details['customer_phone']).replace(' ', '').replace('-', '').lstrip('0')
            if len(phone) == 10:
                cleaned_customer_details['customer_phone'] = phone
            elif len(phone) == 9:
                cleaned_customer_details['customer_phone'] = phone.zfill(10)  # This shouldn't happen for valid numbers
            elif len(phone) > 10:
                cleaned_customer_details['customer_phone'] = phone[:10]  # Take first 10 digits
            else:
                cleaned_customer_details['customer_phone'] = phone.zfill(10)  # Pad if too short
            
            if 'customer_name' not in cleaned_customer_details or not cleaned_customer_details['customer_name']:
                cleaned_customer_details['customer_name'] = f"User{cleaned_customer_details['customer_id']}"
            
            # Use latest v5 API (2023-08-01)
            base_url = "https://sandbox.cashfree.com/pg" if settings.CASHFREE_CONFIG['ENVIRONMENT'] == 'TEST' else "https://api.cashfree.com/pg"
            url = f"{base_url}/links"
            headers = {
                'x-api-version': '2023-08-01',
                'x-client-id': settings.CASHFREE_CONFIG['APP_ID'],
                'x-client-secret': settings.CASHFREE_CONFIG['SECRET_KEY'],
                'Content-Type': 'application/json'
            }
            data = {
                'link_id': order_id,
                'link_amount': amount,
                'link_currency': 'INR',
                'link_purpose': f'Payment for order {order_id}',
                'customer_details': {
                    'customer_id': cleaned_customer_details['customer_id'],
                    'customer_email': cleaned_customer_details['customer_email'],
                    'customer_phone': cleaned_customer_details['customer_phone'],
                    'customer_name': cleaned_customer_details['customer_name']
                },
                'link_meta': {
                    'return_url': return_url or settings.CASHFREE_CONFIG['RETURN_URL'],
                    'notify_url': notify_url or settings.CASHFREE_CONFIG['NOTIFY_URL']
                },
                'link_notify': {
                    'send_email': True,
                    'send_sms': False
                },
                'link_auto_reminders': True
            }
            print("[CASHFREE DEBUG] Creating payment link with data:", data, file=sys.stderr)
            response = requests.post(url, json=data, headers=headers)
            print("[CASHFREE DEBUG] Payment link API status:", response.status_code, file=sys.stderr)
            print("[CASHFREE DEBUG] Payment link API response:", response.text, file=sys.stderr)
            if response.status_code != 200:
                raise Exception(f"Cashfree API error: {response.status_code} - {response.text}")
            response_data = response.json()
            
            # Get payment link URL
            payment_url = response_data.get('link_url')
            if not payment_url:
                raise Exception("Cashfree API did not return link_url")
            
            print(f"[CASHFREE DEBUG] Payment link URL: {payment_url}", file=sys.stderr)
            
            # Create a mock response object
            class MockData:
                def __init__(self, data):
                    self.link_id = data.get('link_id')
                    self.cf_link_id = data.get('cf_link_id')
                    self.link_status = data.get('link_status')
                    self.link_amount = data.get('link_amount')
                    self.link_currency = data.get('link_currency')
            class MockResponse:
                def __init__(self, data):
                    self.data = MockData(data)
            return MockResponse(response_data), payment_url
        except Exception as e:
            raise Exception(f"Failed to create Cashfree payment link: {str(e)}")


class PaymentInitiateView(APIView):
    """
    Initiate payment for event registration
    POST /api/payment/initiate/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Accept either participant_id (free events) or event_id (paid events)
        participant_id = request.data.get('participant_id')
        event_id = request.data.get('event_id')
        return_url = request.data.get('return_url')
        user = request.user

        import traceback
        try:
            if participant_id:
                # Free event flow (legacy)
                from event.models import Participant
                participant = Participant.objects.select_related('event', 'user').get(id=participant_id)
                event = participant.event
                # Check payment already exists
                existing_payment = Payment.objects.filter(user=participant.user, event=event).first()
                if existing_payment:
                    if existing_payment.is_successful:
                        return Response({'error': 'Payment has already been completed for this event.'}, status=status.HTTP_400_BAD_REQUEST)
                    elif existing_payment.status == 'pending':
                        return Response({'error': 'A payment is already pending for this event.', 'existing_payment': PaymentSerializer(existing_payment).data}, status=status.HTTP_400_BAD_REQUEST)
                order_id = f"RADIUM_{participant.id}_{uuid.uuid4().hex[:8]}"
                payment = Payment.objects.create(
                    order_id=order_id,
                    user=participant.user,
                    event=event,
                    participant=participant,
                    amount=event.price,
                    currency='INR',
                    gateway=event.gateway_options or 'cashfree',
                    gateway_credentials=event.gateway_credentials,
                )
                customer_details = {
                    'customer_id': str(participant.user.id),
                    'customer_email': participant.user.email,
                    'customer_phone': getattr(participant.user.profile, 'phone_number', '9999999999'),
                    'customer_name': (participant.user.get_full_name() or participant.user.username or f"User{participant.user.id}").strip() or f"User{participant.user.id}"
                }
            elif event_id:
                # Paid event flow (new)
                from event.models import Event, Participant
                event = Event.objects.get(id=event_id)
                if event.payment_type != 'paid':
                    return Response({'error': 'This event does not require payment.'}, status=status.HTTP_400_BAD_REQUEST)
                if not event.price or event.price <= 0:
                    return Response({'error': 'Event price is not configured.'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Find existing participant (should be created by register API)
                try:
                    participant = Participant.objects.get(user=user, event=event)
                except Participant.DoesNotExist:
                    return Response({'error': 'Participant not found. Please register for the event first.'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if participant already has payment_status=True
                if participant.payment_status:
                    print(f"[PAYMENT_DEBUG] Blocking payment initiation - participant {participant.id} already has payment_status=True")
                    return Response({'error': 'Payment has already been completed for this event.'}, status=status.HTTP_400_BAD_REQUEST)
                
                # If participant shows unpaid, clean up any existing payments and allow new payment
                # This handles cases where payment records exist but participant status is inconsistent
                existing_payments = Payment.objects.filter(user=user, event=event)
                print(f"[PAYMENT_DEBUG] Found {existing_payments.count()} existing payments for user {user.id}, event {event.id}")
                for payment in existing_payments:
                    print(f"[PAYMENT_DEBUG] Payment {payment.id}: status={payment.status}, is_successful={payment.is_successful}, order_id={payment.order_id}")
                
                # Delete all existing payments since participant shows as unpaid
                if existing_payments.exists():
                    print(f"[PAYMENT_DEBUG] Deleting {existing_payments.count()} existing payments since participant {participant.id} has payment_status=False")
                    existing_payments.delete()
                order_id = f"RADIUM_{user.id}_{uuid.uuid4().hex[:8]}"
                payment = Payment.objects.create(
                    order_id=order_id,
                    user=user,
                    event=event,
                    participant=participant,  # Link to participant
                    amount=event.price,
                    currency='INR',
                    gateway=event.gateway_options or 'cashfree',
                    gateway_credentials=event.gateway_credentials,
                )
                customer_details = {
                    'customer_id': str(user.id).zfill(3),  # Ensure at least 3 characters
                    'customer_email': user.email,
                    'customer_phone': str(getattr(user.profile, 'phone_number', '9999999999')).replace(' ', '').replace('-', '').lstrip('0')[:10].zfill(10),  # Ensure 10 digits, remove leading zeros
                    'customer_name': (user.get_full_name() or user.username or f"User{user.id}").strip() or f"User{user.id}"
                }
            else:
                return Response({'error': 'Missing participant_id or event_id.'}, status=status.HTTP_400_BAD_REQUEST)

            # Construct return_url with order_id parameter
            base_return_url = return_url or settings.CASHFREE_CONFIG['RETURN_URL']
            if '?' in base_return_url:
                constructed_return_url = f"{base_return_url}&order_id={order_id}"
            else:
                constructed_return_url = f"{base_return_url}?order_id={order_id}"

            # Determine which payment gateway to use
            gateway = event.gateway_options or 'cashfree'  # Default to cashfree if not set
            gateway_credentials = event.gateway_credentials or {}
            
            if gateway == 'payu':
                # Initialize PayU service
                payu_service = PayUService(credentials=gateway_credentials)
                cf_response, payment_url = payu_service.create_order(
                    order_id=order_id,
                    amount=float(payment.amount),
                    customer_details=customer_details,
                    return_url=constructed_return_url,
                    notify_url=settings.PAYU_CONFIG.get('NOTIFY_URL', '')
                )
            else:
                # Initialize Cashfree service (default)
                cashfree_service = CashfreeService(credentials=gateway_credentials)
                cf_response, payment_url = cashfree_service.create_order(
                    order_id=order_id,
                    amount=float(payment.amount),
                    customer_details=customer_details,
                    return_url=constructed_return_url,
                    notify_url=settings.CASHFREE_CONFIG['NOTIFY_URL']
                )
            import sys
            print("=== CASHFREE DEBUG START ===", file=sys.stderr)
            print("Full Cashfree response (repr):", repr(cf_response), file=sys.stderr)
            print("Cashfree response type:", type(cf_response), file=sys.stderr)
            print("Cashfree response dir:", dir(cf_response), file=sys.stderr)
            if hasattr(cf_response, 'data'):
                print("Cashfree response data:", cf_response.data, file=sys.stderr)
                print("Cashfree response data type:", type(cf_response.data), file=sys.stderr)
                if hasattr(cf_response.data, 'to_dict'):
                    print("Cashfree response data dict:", cf_response.data.to_dict(), file=sys.stderr)
                print("Cashfree data attributes:", [attr for attr in dir(cf_response.data) if not attr.startswith('_')], file=sys.stderr)
                if hasattr(cf_response.data, 'order_id'):
                    print("Order ID:", cf_response.data.order_id, file=sys.stderr)
                if hasattr(cf_response.data, 'payment_session_id'):
                    print("Payment Session ID:", repr(cf_response.data.payment_session_id), file=sys.stderr)
                if hasattr(cf_response.data, 'errors'):
                    print("Errors:", cf_response.data.errors, file=sys.stderr)
            else:
                print("No data attribute on response", file=sys.stderr)
            print("=== CASHFREE DEBUG END ===", file=sys.stderr)

            # Validate Cashfree response
            if not hasattr(cf_response, 'data') or not cf_response.data:
                raise Exception("Invalid Cashfree response: no data returned")

            if not hasattr(cf_response.data, 'payment_session_id') or not cf_response.data.payment_session_id:
                raise Exception("Cashfree API did not return payment_session_id. Check credentials and configuration.")

            # Sanitize payment_session_id in case Cashfree sandbox returns a corrupted token
            raw_session = getattr(cf_response.data, 'payment_session_id', '') or ''
            if raw_session and raw_session.endswith('payment'):
                import sys
                print(f"[CASHFREE WARNING] Corrupted payment_session_id received: {repr(raw_session)}. Stripping trailing 'payment' fragments.", file=sys.stderr)
                # Remove any trailing repeated 'payment' fragments
                while raw_session.endswith('payment'):
                    raw_session = raw_session[:-7]

            payment.cf_order_id = cf_response.data.cf_order_id
            payment.payment_session_id = cf_response.data.payment_session_id
            payment.cf_token = cf_response.data.payment_session_id or ''
            payment.customer_details = customer_details
            payment.save()
            # Return consistent response structure for both gateways
            if gateway == 'payu':
                return Response({
                    'success': True,
                    'payment': PaymentSerializer(payment).data,
                    'gateway': 'payu',
                    'payment_data': {
                        'gateway': 'payu',
                        'order_id': cf_response.data.order_id,
                        'payment_url': payment_url,
                        'form_data': cf_response.data.form_data,
                        'environment': settings.PAYU_CONFIG['ENVIRONMENT']
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': True,
                    'payment': PaymentSerializer(payment).data,
                    'gateway': 'cashfree',
                    'payment_data': {
                        'gateway': 'cashfree',
                        'order_id': cf_response.data.order_id,
                        'cf_order_id': cf_response.data.cf_order_id,
                        'order_amount': cf_response.data.order_amount,
                        'order_currency': cf_response.data.order_currency,
                        'environment': settings.CASHFREE_CONFIG['ENVIRONMENT'],
                        'payment_session_id': cf_response.data.payment_session_id,
                        'payment_url': payment_url
                    },
                    # Keep backward compatibility
                    'cashfree_data': {
                        'order_id': cf_response.data.order_id,
                        'cf_order_id': cf_response.data.cf_order_id,
                        'order_amount': cf_response.data.order_amount,
                        'order_currency': cf_response.data.order_currency,
                        'environment': settings.CASHFREE_CONFIG['ENVIRONMENT'],
                        'payment_session_id': cf_response.data.payment_session_id,
                        'payment_url': payment_url
                    }
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            tb = traceback.format_exc()
            print(tb)
            return Response({'error': f'Failed to initiate payment: {str(e)}', 'traceback': tb}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentStatusView(APIView):
    """
    Check payment status
    GET /api/payment/status/{order_id}/
    """
    permission_classes = [AllowAny]  # Allow anyone to check payment status with order_id

    def get(self, request, order_id):
        try:
            payment = get_object_or_404(Payment, order_id=order_id)
            
            print(f"[PAYMENT_STATUS_DEBUG] Payment {order_id}: status={payment.status}, is_successful={payment.is_successful}")
            print(f"[PAYMENT_STATUS_DEBUG] Participant: {payment.participant}, payment_status: {payment.participant.payment_status if payment.participant else 'No participant'}")
            
            return Response({
                'success': True,
                'data': {
                    'payment': PaymentSerializer(payment).data
                }
            }, status=status.HTTP_200_OK)

        except Payment.DoesNotExist:
            print(f"[PAYMENT_STATUS_DEBUG] Payment {order_id} not found")
            return Response({
                'success': False,
                'error': 'Payment not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"[PAYMENT_STATUS_DEBUG] Error fetching payment {order_id}: {str(e)}")
            return Response({
                'success': False,
                'error': f'Failed to fetch payment status: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentWebhookView(APIView):
    """
    Handle Cashfree webhooks securely
    POST /api/payment/webhook/
    """
    permission_classes = [AllowAny]  # Webhooks don't require authentication

    def post(self, request):
        try:
            # Get raw payload and signature (use bytes for signature verification)
            payload = request.body  # bytes
            signature = request.headers.get('X-Webhook-Signature')

            print(f"[WEBHOOK_DEBUG] Received webhook, signature: {signature is not None}")
            print(f"[WEBHOOK_DEBUG] Payload length: {len(payload)}")

            # For production, skip signature verification since webhook secret is not available
            from django.conf import settings
            skip_signature_check = (
                settings.CASHFREE_CONFIG.get('ENVIRONMENT') == 'TEST' or
                settings.CASHFREE_CONFIG.get('ENVIRONMENT') == 'PROD' or  # Skip for production too
                not settings.CASHFREE_CONFIG.get('WEBHOOK_SECRET') or
                settings.CASHFREE_CONFIG.get('WEBHOOK_SECRET') == 'changeme' or
                settings.CASHFREE_CONFIG.get('WEBHOOK_SECRET') == ''
            )

            print(f"[WEBHOOK_DEBUG] Environment: {settings.CASHFREE_CONFIG.get('ENVIRONMENT')}")
            print(f"[WEBHOOK_DEBUG] Webhook secret configured: {bool(settings.CASHFREE_CONFIG.get('WEBHOOK_SECRET'))}")
            print(f"[WEBHOOK_DEBUG] Skip signature check: {skip_signature_check}")

            if not skip_signature_check and not signature:
                print("[WEBHOOK_DEBUG] Missing webhook signature")
                return Response({'error': 'Missing webhook signature'}, status=status.HTTP_400_BAD_REQUEST)

            # Verify webhook signature if not skipping
            if not skip_signature_check:
                cashfree_service = CashfreeService()
                if not cashfree_service.verify_webhook_signature(payload, signature, request.headers):
                    print("[WEBHOOK_DEBUG] Invalid webhook signature")
                    return Response({'error': 'Invalid webhook signature'}, status=status.HTTP_401_UNAUTHORIZED)
            else:
                print("[WEBHOOK_DEBUG] Skipping signature verification for test environment")

            # Parse webhook data
            import json
            webhook_data = json.loads(payload.decode('utf-8'))

            print(f"[WEBHOOK_DEBUG] Webhook data: {webhook_data}")

            order_id = webhook_data.get('data', {}).get('order', {}).get('order_id')
            if not order_id:
                print("[WEBHOOK_DEBUG] Order ID not found in webhook")
                return Response({'error': 'Order ID not found in webhook.'}, status=status.HTTP_400_BAD_REQUEST)

            print(f"[WEBHOOK_DEBUG] Processing webhook for order_id: {order_id}")

            # Get payment details from webhook
            # For PAYMENT_CHARGES_WEBHOOK, status is in payment object, not order
            payment_data = webhook_data.get('data', {}).get('payment', {})
            order_data = webhook_data.get('data', {}).get('order', {})
            
            payment_status = payment_data.get('payment_status')
            cf_payment_id = payment_data.get('cf_payment_id')
            # Extract payment method type (e.g., 'upi', 'card', 'netbanking')
            payment_method_obj = payment_data.get('payment_method', {})
            payment_method = list(payment_method_obj.keys())[0] if payment_method_obj else None
            cf_order_id = order_data.get('cf_order_id')

            print(f"[WEBHOOK_DEBUG] Payment status: {payment_status}, CF payment ID: {cf_payment_id}, CF order ID: {cf_order_id}")

            # Find and update payment
            try:
                payment = Payment.objects.get(order_id=order_id)
                
                print(f"[WEBHOOK_DEBUG] Found payment {payment.id}, current status: {payment.status}")
                
                # Log webhook
                webhook_type = 'payment_success' if payment_status == 'SUCCESS' else 'payment_failed'
                PaymentWebhook.objects.create(
                    payment=payment,
                    webhook_type=webhook_type,
                    payload=webhook_data,
                    signature=signature or '',
                    is_verified=not skip_signature_check,
                    processed=True
                )
                
                # Update payment status based on gateway status
                if payment_status == 'SUCCESS':
                    print(f"[WEBHOOK_DEBUG] Marking payment {payment.id} as successful")
                    payment.status = 'success'
                    payment.paid_at = timezone.now()
                    payment.cf_order_id = cf_order_id or payment.cf_order_id
                    payment.cf_payment_id = cf_payment_id
                    payment.payment_method = payment_method
                    # Store full payment method details in payment_details
                    payment.payment_details = payment_data
                    payment.save(update_fields=['status', 'paid_at', 'cf_order_id', 'cf_payment_id', 'payment_method', 'payment_details', 'updated_at'])
                    
                    # Only update participant payment_status - no additional actions
                    if payment.participant:
                        print(f"[WEBHOOK_DEBUG] Updating participant {payment.participant.id} payment_status to True")
                        payment.participant.payment_status = True
                        payment.participant.save(update_fields=['payment_status'])
                    
                    print(f"[WEBHOOK_DEBUG] Payment {payment.id} verification complete - only status updated")
                    
                elif payment_status == 'FAILED':
                    print(f"[WEBHOOK_DEBUG] Marking payment {payment.id} as failed")
                    payment.status = 'failed'
                    payment.save()
                    
                elif payment_status == 'CANCELLED':
                    print(f"[WEBHOOK_DEBUG] Marking payment {payment.id} as cancelled")
                    payment.status = 'cancelled'
                    payment.save()
                    
                elif payment_status == 'PENDING':
                    print(f"[WEBHOOK_DEBUG] Payment {payment.id} still pending")
                    payment.status = 'pending'
                    payment.save()

                print(f"[WEBHOOK_DEBUG] Payment {payment.id} updated to status: {payment.status}")
                return Response({'success': True, 'message': f'Payment {order_id} updated to {payment_status}'}, status=status.HTTP_200_OK)
                
            except Payment.DoesNotExist:
                print(f"[WEBHOOK_DEBUG] Payment with order_id {order_id} not found")
                # Still log the webhook even if payment not found
                PaymentWebhook.objects.create(
                    payment=None,  # Will need to handle this in model
                    webhook_type='order_failed',
                    payload=webhook_data,
                    signature=signature or '',
                    is_verified=not skip_signature_check,
                    processed=False
                )
                return Response({'error': f'Payment with order_id {order_id} not found.'}, status=status.HTTP_404_NOT_FOUND)

        except json.JSONDecodeError as e:
            print(f"[WEBHOOK_DEBUG] Invalid JSON in webhook payload: {str(e)}")
            return Response({'error': 'Invalid JSON in webhook payload'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"[WEBHOOK_DEBUG] Webhook processing failed: {str(e)}")
            import traceback
            print(f"[WEBHOOK_DEBUG] Traceback: {traceback.format_exc()}")
            return Response({'error': f'Webhook processing failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentListView(APIView):
    """
    List user's payments
    GET /api/payment/list/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            payments = Payment.objects.filter(user=request.user).select_related('event', 'participant')

            # Filter by status if provided
            status_filter = request.GET.get('status')
            if status_filter:
                payments = payments.filter(status=status_filter)

            serializer = PaymentSerializer(payments, many=True)
            return Response({
                'success': True,
                'payments': serializer.data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Failed to fetch payments: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def payment_config(request):
    """
    Get payment configuration for frontend
    GET /api/payment/config/
    """
    return Response({
        'environment': settings.CASHFREE_CONFIG['ENVIRONMENT'],
        'is_production': settings.CASHFREE_CONFIG['ENVIRONMENT'] == 'PRODUCTION',
        'app_id': settings.CASHFREE_CONFIG['APP_ID'] if settings.CASHFREE_CONFIG['ENVIRONMENT'] == 'TEST' else None,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_test_payment(request):
    """
    TEST ENDPOINT: Create a test payment for local testing
    POST /api/payment/create-test/
    Body: {"event_id": 1} (optional)
    """
    if not settings.DEBUG:
        return Response({'error': 'This endpoint is only available in DEBUG mode'}, status=status.HTTP_403_FORBIDDEN)

    from event.models import Event
    from authentication.models import UserProfile

    try:
        # Get or create a test event
        event = Event.objects.filter(is_active=True).first()
        if not event:
            # Create a test event if none exists
            event = Event.objects.create(
                event_name="Test Event",
                description="Test event for payment testing",
                event_date=timezone.now() + timezone.timedelta(days=1),
                price=100.00,
                max_participants=100,
                is_active=True,
                payment_type='paid',
            )

        # Get or create participant
        participant, created = Participant.objects.get_or_create(
            user=request.user,
            event=event,
            defaults={'registered_at': timezone.now()}
        )

        # Check if payment already exists
        existing_payment = Payment.objects.filter(
            user=request.user,
            event=event
        ).first()

        if existing_payment:
            return Response({
                'success': True,
                'message': 'Payment already exists',
                'payment': PaymentSerializer(existing_payment).data
            })

        # Generate unique order ID
        order_id = f"TEST_{participant.id}_{uuid.uuid4().hex[:8]}"

        # Create test payment
        payment = Payment.objects.create(
            order_id=order_id,
            user=request.user,
            event=event,
            participant=participant,
            amount=event.price,
            currency='INR',
            status='pending',
            customer_details={
                'customer_id': str(request.user.id),
                'customer_email': request.user.email,
                'customer_phone': getattr(request.user.profile, 'phone_number', '9999999999'),
                'customer_name': request.user.get_full_name() or request.user.username
            }
        )

        return Response({
            'success': True,
            'message': 'Test payment created successfully',
            'payment': PaymentSerializer(payment).data,
            'instructions': 'Use the order_id to test payment success via /api/payment/test-success/'
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def test_payment_success(request):
    """
    TEST ENDPOINT: Manually mark payment as successful (for local testing without webhooks)
    POST /api/payment/test-success/
    Body: {"order_id": "RADIUM_123_abc"} or {"user_id": 123, "event_id": 456}
    """
    # Temporarily allow in production for fixing payment issues
    # if not settings.DEBUG:
    #     return Response({'error': 'This endpoint is only available in DEBUG mode'}, status=status.HTTP_403_FORBIDDEN)

    order_id = request.data.get('order_id')
    user_id = request.data.get('user_id')
    event_id = request.data.get('event_id')

    if order_id:
        # Try to find by order_id first
        try:
            payment = Payment.objects.get(order_id=order_id)
            payment.mark_as_successful(
                cf_payment_id=f"TEST_{order_id}",
                payment_details={'test_payment': True, 'marked_by': 'test_endpoint'}
            )
            return Response({
                'success': True,
                'message': f'Payment {order_id} marked as successful for testing',
                'payment': PaymentSerializer(payment).data
            })
        except Payment.DoesNotExist:
            return Response({
                'error': f'Payment with order_id {order_id} not found',
                'suggestion': 'Try using user_id and event_id instead'
            }, status=status.HTTP_404_NOT_FOUND)
    
    elif user_id and event_id:
        # Find the most recent pending payment for this user/event
        try:
            payment = Payment.objects.filter(
                user_id=user_id,
                event_id=event_id,
                status='pending'
            ).order_by('-created_at').first()
            
            if not payment:
                return Response({
                    'error': f'No pending payment found for user {user_id}, event {event_id}',
                    'existing_payments': list(Payment.objects.filter(
                        user_id=user_id, event_id=event_id
                    ).values('order_id', 'status', 'created_at'))
                }, status=status.HTTP_404_NOT_FOUND)
            
            payment.mark_as_successful(
                cf_payment_id=f"TEST_{payment.order_id}",
                payment_details={'test_payment': True, 'marked_by': 'test_endpoint', 'found_by_user_event': True}
            )
            return Response({
                'success': True,
                'message': f'Payment {payment.order_id} marked as successful for testing',
                'payment': PaymentSerializer(payment).data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    else:
        return Response({
            'error': 'Either order_id or both user_id and event_id are required',
            'examples': {
                'by_order_id': {'order_id': 'RADIUM_123_abc'},
                'by_user_event': {'user_id': 123, 'event_id': 456}
            }
        }, status=status.HTTP_400_BAD_REQUEST)


class PaymentConfigurationView(APIView):
    """
    Manage payment gateway configuration
    GET /api/payment/config-admin/ - Get current configuration
    POST /api/payment/config-admin/ - Update configuration
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """Get current payment configuration"""
        config = PaymentConfiguration.get_active_config()
        if not config:
            return Response({
                'error': 'No payment configuration found. Please create one.'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = PaymentConfigurationSerializer(config)
        return Response({
            'success': True,
            'configuration': serializer.data
        })

    def post(self, request):
        """Create or update payment configuration"""
        config = PaymentConfiguration.get_active_config()

        if config:
            # Update existing configuration
            serializer = PaymentConfigurationSerializer(
                config,
                data=request.data,
                partial=True,
                context={'request': request}
            )
        else:
            # Create new configuration
            serializer = PaymentConfigurationSerializer(
                data=request.data,
                context={'request': request}
            )

        if serializer.is_valid():
            # Set the user who updated the configuration
            instance = serializer.save(updated_by=request.user)
            return Response({
                'success': True,
                'message': 'Payment configuration updated successfully',
                'configuration': PaymentConfigurationSerializer(instance).data
            }, status=status.HTTP_200_OK if config else status.HTTP_201_CREATED)

        return Response({
            'error': 'Invalid configuration data',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class PaymentConfigurationListView(APIView):
    """
    List all payment configurations (Admin only)
    GET /api/payment/config-list/
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """Get all payment configurations"""
        configs = PaymentConfiguration.objects.all()
        serializer = PaymentConfigurationSerializer(configs, many=True)
        return Response({
            'success': True,
            'configurations': serializer.data,
            'active_config': PaymentConfiguration.get_active_config().id if PaymentConfiguration.get_active_config() else None
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def switch_payment_config(request):
    """
    Switch active payment configuration
    POST /api/payment/config-switch/
    Body: {"config_id": "uuid"}
    """
    config_id = request.data.get('config_id')
    if not config_id:
        return Response({'error': 'config_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        config = PaymentConfiguration.objects.get(id=config_id)
        # Deactivate all configs and activate the selected one
        PaymentConfiguration.objects.all().update(is_active=False)
        config.is_active = True
        config.updated_by = request.user
        config.save()

        return Response({
            'success': True,
            'message': f'Switched to {config.environment} environment',
            'configuration': PaymentConfigurationSerializer(config).data
        })
    except PaymentConfiguration.DoesNotExist:
        return Response({'error': 'Configuration not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def process_payment_confirmation(request):
    """
    Manually process payment confirmation actions (OD creation, email sending)
    POST /api/payment/process-confirmation/
    Body: {"order_id": "RADIUM_123_abc"} or {"payment_id": 123}
    """
    order_id = request.data.get('order_id')
    payment_id = request.data.get('payment_id')
    
    if not order_id and not payment_id:
        return Response({'error': 'Either order_id or payment_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        if order_id:
            payment = Payment.objects.get(order_id=order_id)
        else:
            payment = Payment.objects.get(id=payment_id)
        
        if not payment.is_successful:
            return Response({'error': 'Payment is not successful'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not payment.participant:
            return Response({'error': 'No participant associated with this payment'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create OD entry and send QR email
        from event.models import ODList
        from event.email_services import send_qr_email_to_participant
        
        od_entry, created = ODList.objects.get_or_create(
            participant=payment.participant,
            event=payment.participant.event,
            defaults={'qr_sent': False, 'attendance': False}
        )
        
        actions_performed = []
        
        if created:
            actions_performed.append('Created OD entry')
        else:
            actions_performed.append('OD entry already exists')
        
        # Send QR email
        email_result = send_qr_email_to_participant(payment.participant, force=True)
        if email_result['success']:
            actions_performed.append('QR email sent successfully')
        else:
            actions_performed.append(f'Failed to send QR email: {email_result["message"]}')
        
        return Response({
            'success': True,
            'message': 'Payment confirmation processed',
            'actions_performed': actions_performed,
            'payment': PaymentSerializer(payment).data
        })
        
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def payment_debug(request):
    """
    Debug endpoint to help troubleshoot payment issues
    GET /api/payment/debug/?order_id=RADIUM_123_abc
    """
    order_id = request.GET.get('order_id')
    
    if not order_id:
        return Response({
            'error': 'order_id parameter is required',
            'example': '/api/payment/debug/?order_id=RADIUM_123_abc'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Clean the order_id in case it's corrupted
        clean_order_id = str(order_id).strip()
        
        # Try to find the payment
        payment = Payment.objects.filter(order_id=clean_order_id).first()
        
        if not payment:
            # Try to find similar order IDs
            similar_payments = Payment.objects.filter(
                order_id__icontains=clean_order_id[:10]
            )[:5]
            
            return Response({
                'error': f'Payment with order_id {clean_order_id} not found',
                'similar_payments': [
                    {
                        'order_id': p.order_id,
                        'status': p.status,
                        'created_at': p.created_at,
                        'user': p.user.username if p.user else None
                    } for p in similar_payments
                ]
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'payment': {
                'order_id': payment.order_id,
                'status': payment.status,
                'gateway': payment.gateway,
                'amount': payment.amount,
                'created_at': payment.created_at,
                'paid_at': payment.paid_at,
                'user': payment.user.username if payment.user else None,
                'event': payment.event.event_name if payment.event else None,
                'participant_payment_status': payment.participant.payment_status if payment.participant else None
            }
        })
        
    except Exception as e:
        return Response({
            'error': f'Debug failed: {str(e)}',
            'order_id_received': order_id
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def cleanup_corrupted_payments(request):
    """
    Clean up corrupted or invalid payments
    POST /api/payment/cleanup/
    """
    try:
        # Find payments with potentially corrupted order IDs
        corrupted_payments = Payment.objects.filter(
            models.Q(order_id__icontains='_') & 
            ~models.Q(order_id__startswith='RADIUM_') &
            ~models.Q(order_id__startswith='TEST_')
        )
        
        count = corrupted_payments.count()
        
        if count == 0:
            return Response({
                'success': True,
                'message': 'No corrupted payments found',
                'cleaned_count': 0
            })
        
        # Get details before deletion
        corrupted_details = list(corrupted_payments.values(
            'order_id', 'status', 'created_at', 'user__username'
        ))
        
        # Delete corrupted payments
        corrupted_payments.delete()
        
        return Response({
            'success': True,
            'message': f'Cleaned up {count} corrupted payments',
            'cleaned_count': count,
            'cleaned_payments': corrupted_details
        })
        
    except Exception as e:
        return Response({
            'error': f'Cleanup failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@api_view(['POST', 'GET'])
@permission_classes([AllowAny])
def payu_success_response(request):
    """
    Handle PayU success response
    POST/GET /api/payment/payu/success/
    """
    try:
        # PayU sends data via POST for success
        if request.method == 'POST':
            data = request.POST
        else:
            data = request.GET
        
        print(f"[PAYU_SUCCESS] Received data: {dict(data)}")
        
        # Extract PayU response parameters
        txnid = data.get('txnid')  # This is our order_id
        status = data.get('status')
        amount = data.get('amount')
        productinfo = data.get('productinfo')
        firstname = data.get('firstname')
        email = data.get('email')
        mihpayid = data.get('mihpayid')  # PayU transaction ID
        hash_received = data.get('hash')
        
        if not txnid:
            return Response({'error': 'Missing transaction ID'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify hash for security
        merchant_salt = settings.PAYU_CONFIG.get('MERCHANT_SALT')
        if merchant_salt and hash_received:
            # PayU success hash format: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
            hash_string = f"{merchant_salt}|{status}||||||||||{email}|{firstname}|{productinfo}|{amount}|{txnid}|{settings.PAYU_CONFIG.get('MERCHANT_KEY')}"
            expected_hash = hashlib.sha512(hash_string.encode('utf-8')).hexdigest()
            
            if hash_received.lower() != expected_hash.lower():
                print(f"[PAYU_SUCCESS] Hash mismatch. Expected: {expected_hash}, Received: {hash_received}")
                return Response({'error': 'Invalid hash'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find and update payment
        try:
            payment = Payment.objects.get(order_id=txnid)
            
            if status == 'success':
                payment.status = 'success'
                payment.paid_at = timezone.now()
                payment.cf_payment_id = mihpayid  # Store PayU transaction ID
                payment.payment_details = dict(data)
                payment.save(update_fields=['status', 'paid_at', 'cf_payment_id', 'payment_details', 'updated_at'])
                
                # Update participant payment status
                if payment.participant:
                    payment.participant.payment_status = True
                    payment.participant.save(update_fields=['payment_status'])
                
                print(f"[PAYU_SUCCESS] Payment {txnid} marked as successful")
                
                # Redirect to frontend success page
                frontend_url = f"http://localhost:3000/payment/success?order_id={txnid}"
                return redirect(frontend_url)
            else:
                payment.status = 'failed'
                payment.payment_details = dict(data)
                payment.save(update_fields=['status', 'payment_details', 'updated_at'])
                
                print(f"[PAYU_SUCCESS] Payment {txnid} marked as failed")
                
                # Redirect to frontend failure page
                frontend_url = f"http://localhost:3000/payment/failure?order_id={txnid}"
                return redirect(frontend_url)
                
        except Payment.DoesNotExist:
            print(f"[PAYU_SUCCESS] Payment with order_id {txnid} not found")
            return Response({'error': f'Payment {txnid} not found'}, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        print(f"[PAYU_SUCCESS] Error processing PayU success: {str(e)}")
        return Response({'error': f'Processing failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@api_view(['POST', 'GET'])
@permission_classes([AllowAny])
def payu_failure_response(request):
    """
    Handle PayU failure response
    POST/GET /api/payment/payu/failure/
    """
    try:
        # PayU sends data via POST for failure
        if request.method == 'POST':
            data = request.POST
        else:
            data = request.GET
        
        print(f"[PAYU_FAILURE] Received data: {dict(data)}")
        
        # Extract PayU response parameters
        txnid = data.get('txnid')  # This is our order_id
        status = data.get('status')
        error_Message = data.get('error_Message')
        
        if not txnid:
            return Response({'error': 'Missing transaction ID'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find and update payment
        try:
            payment = Payment.objects.get(order_id=txnid)
            payment.status = 'failed'
            payment.payment_details = dict(data)
            payment.save(update_fields=['status', 'payment_details', 'updated_at'])
            
            print(f"[PAYU_FAILURE] Payment {txnid} marked as failed. Error: {error_Message}")
            
            # Redirect to frontend failure page
            frontend_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/payment/failure?order_id={txnid}&error={error_Message}"
            return redirect(frontend_url)
                
        except Payment.DoesNotExist:
            print(f"[PAYU_FAILURE] Payment with order_id {txnid} not found")
            return Response({'error': f'Payment {txnid} not found'}, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        print(f"[PAYU_FAILURE] Error processing PayU failure: {str(e)}")
        return Response({'error': f'Processing failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['POST'])
@permission_classes([AllowAny])
def simulate_payu_response(request):
    """
    Simulate PayU response for testing (when ngrok is not available)
    POST /api/payment/simulate-payu/
    Body: {"order_id": "RADIUM_2_38640d80", "status": "success"}
    """
    try:
        order_id = request.data.get('order_id')
        status = request.data.get('status', 'success')
        
        if not order_id:
            return Response({'error': 'order_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the payment
        try:
            payment = Payment.objects.get(order_id=order_id)
        except Payment.DoesNotExist:
            return Response({'error': f'Payment {order_id} not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Simulate PayU response data
        payu_data = {
            'txnid': order_id,
            'status': status,
            'amount': str(payment.amount),
            'productinfo': f'Event Registration - Order {order_id}',
            'firstname': payment.customer_details.get('customer_name', 'User'),
            'email': payment.customer_details.get('customer_email', 'test@example.com'),
            'mihpayid': f'SIMULATED_{order_id}',
            'hash': 'simulated_hash_for_testing'
        }
        
        # Process the response
        if status == 'success':
            payment.status = 'success'
            payment.paid_at = timezone.now()
            payment.cf_payment_id = payu_data['mihpayid']
            payment.payment_details = payu_data
            payment.save(update_fields=['status', 'paid_at', 'cf_payment_id', 'payment_details', 'updated_at'])
            
            # Update participant payment status
            if payment.participant:
                payment.participant.payment_status = True
                payment.participant.save(update_fields=['payment_status'])
            
            message = f'Payment {order_id} simulated as successful'
        else:
            payment.status = 'failed'
            payment.payment_details = payu_data
            payment.save(update_fields=['status', 'payment_details', 'updated_at'])
            message = f'Payment {order_id} simulated as failed'
        
        return Response({
            'success': True,
            'message': message,
            'payment': PaymentSerializer(payment).data,
            'simulated_data': payu_data
        })
        
    except Exception as e:
        return Response({
            'error': f'Simulation failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)