import qrcode
from io import BytesIO
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import format_html
from .models import ODList, Participant
from email.mime.image import MIMEImage

def generate_qr_code(hash_value):
    """Generate QR code image for the hash"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(hash_value)
    qr.make(fit=True)
    img = qr.make_image(fill='black', back_color='white')

    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer

def send_registration_email(od_list):
    """Send email with hosted logo (URL) and inline QR code (MIMEImage) for offline events only."""
    if not isinstance(od_list, ODList):
        return False

    participant = od_list.participant
    user = participant.user
    event = participant.event

    # Check if event is online - skip QR code generation for online events
    is_online_event = getattr(event, 'event_mode', 'offline') == 'online'

    # 1) Generate QR code in memory (only for offline events)
    qr_bytes = None
    if not is_online_event:
        qr_buffer = generate_qr_code(od_list.hash)
        qr_bytes = qr_buffer.getvalue()

    # 2) Hosted logo URL (update url according to your deployment)
    logo_url = "https://raw.githubusercontent.com/Chandhru-241801035/FloatChat-API-Documentation/refs/heads/main/DEVS_White.png"

    # 3) Context for the HTML template
    context = {
        'user': user,
        'event': event,
        'od_list': od_list,
        'hash': od_list.hash,
        'logo_url': logo_url,
        'is_online_event': is_online_event,
        'meeting_url': getattr(event, 'meeting_url', None) if is_online_event else None,
    }

    # 4) Render HTML
    print(f"User: {user}, First name: {user.first_name}, Last name: {user.last_name}")
    html_message = render_to_string('event/registration_email.html', context)

    # 5) Email setup
    subject = f"Registration Confirmation for {event.event_name}"
    from_email = settings.DEFAULT_FROM_EMAIL
    to = [user.email]

    email = EmailMultiAlternatives(subject=subject, body=html_message, from_email=from_email, to=to)
    email.attach_alternative(html_message, "text/html")

    # 6) Attach QR as inline MIME image (only for offline events)
    if qr_bytes and not is_online_event:
        try:
            qr_img = MIMEImage(qr_bytes, _subtype='png')
            qr_img.add_header('Content-ID', '<qr_code>')
            qr_img.add_header('Content-Disposition', 'inline', filename='qr.png')
            email.attach(qr_img)
        except Exception as e:
            print("Failed to attach QR image:", e)

    # 7) Send email
    try:
        print(f"User: {user}, First name: {user.first_name}, Last name: {user.last_name}")
        print(f"Sending email to: {user.email}")
        print(f"Email subject: {subject}")
        print(f"Email backend: {settings.EMAIL_BACKEND}")
        print(f"Email host: {settings.EMAIL_HOST}")
        print(f"Email port: {settings.EMAIL_PORT}")
        print(f"Email use TLS: {settings.EMAIL_USE_TLS}")
        print(f"Email host user: {settings.EMAIL_HOST_USER}")
        print(f"Default from email: {settings.DEFAULT_FROM_EMAIL}")

        result = email.send()
        print(f"Email send result: {result}")
        return True
    except Exception as e:
        print("Email send failed:", e)
        import traceback
        print("Full traceback:", traceback.format_exc())
        return False


def send_qr_email_to_participant(participant, force=False):
    """
    Centralized QR email sending logic for participants.

    Args:
        participant: Participant instance
        force: If True, send even if already sent

    Returns:
        dict: {'success': bool, 'message': str, 'od_list': ODList or None}
    """
    if not isinstance(participant, Participant):
        return {'success': False, 'message': 'Invalid participant', 'od_list': None}

    try:
        od_list, created = ODList.objects.get_or_create(
            participant=participant,
            event=participant.event,
            defaults={'hash': None}  
        )

        if not force and od_list.qr_sent:
            return {
                'success': False,
                'message': 'QR email already sent',
                'od_list': od_list
            }

        if send_registration_email(od_list):
            od_list.qr_sent = True
            od_list.save(update_fields=['qr_sent'])
            message = 'QR email sent successfully'
            if created:
                message += ' (OD entry created)'
            return {
                'success': True,
                'message': message,
                'od_list': od_list
            }
        else:
            return {
                'success': False,
                'message': 'Failed to send QR email',
                'od_list': od_list
            }

    except Exception as e:
        return {
            'success': False,
            'message': f'Error sending QR email: {str(e)}',
            'od_list': None
        }

def create_participant_with_od(user, event, send_email=True, answers=None, payment_status=True):
    """
    Centralized participant creation with OD handling.

    Args:
        user: User instance
        event: Event instance
        send_email: Whether to send QR email immediately
        answers: List of answer dictionaries (optional)
        payment_status: Initial payment status (default True for free events)

    Returns:
        dict: {'success': bool, 'participant': Participant or None, 'od_list': ODList or None, 'message': str}
    """
    try:
        print(f"[PARTICIPANT_DEBUG] Creating participant for user: {user.username}, event: {event.event_name}")
        existing_participant = Participant.objects.filter(user=user, event=event).first()
        if existing_participant:
            print(f"[PARTICIPANT_DEBUG] Found existing participant: {existing_participant.id}")
            if existing_participant.payment_status:
                print(f"[PARTICIPANT_DEBUG] User already fully registered")
                return {
                    'success': False,
                    'participant': existing_participant,
                    'od_list': None,
                    'message': 'User already fully registered'
                }
            else:
                print(f"[PARTICIPANT_DEBUG] Updating payment status for existing participant")
                existing_participant.payment_status = True
                if answers:
                    existing_participant.answers = answers
                existing_participant.save()
                participant = existing_participant
                message = 'Payment approved for existing registration'
        else:
            print(f"[PARTICIPANT_DEBUG] Creating new participant")
            participant = Participant.objects.create(
                user=user,
                event=event,
                registration_status='confirmed',
                payment_status=payment_status,
                answers=answers or []
            )
            print(f"[PARTICIPANT_DEBUG] New participant created with ID: {participant.id}, payment_status: {payment_status}")
            message = 'Participant created successfully'

        print(f"[PARTICIPANT_DEBUG] Participant can_attend: {participant.can_attend}")
        if participant.can_attend:
            print(f"[PARTICIPANT_DEBUG] Creating OD list entry")
            od_list = ODList.objects.create(participant=participant, event=participant.event)
            print(f"[PARTICIPANT_DEBUG] OD list created with ID: {od_list.id}, hash: {od_list.hash}")

            if send_email:
                print(f"[PARTICIPANT_DEBUG] Sending QR email")
                email_result = send_qr_email_to_participant(participant, force=False)
                if email_result['success']:
                    message += ' and QR email sent'
                    print(f"[PARTICIPANT_DEBUG] QR email sent successfully")
                else:
                    message += f' but email failed: {email_result["message"]}'
                    print(f"[PARTICIPANT_DEBUG] QR email failed: {email_result['message']}")

            return {
                'success': True,
                'participant': participant,
                'od_list': od_list,
                'message': message
            }
        else:
            print(f"[PARTICIPANT_DEBUG] Participant cannot attend yet - OD not created")
            return {
                'success': True,
                'participant': participant,
                'od_list': None,
                'message': f'{message} but OD not created yet'
            }

    except Exception as e:
        print(f"[PARTICIPANT_DEBUG] Error creating participant: {str(e)}")
        import traceback
        print(f"[PARTICIPANT_DEBUG] Full traceback: {traceback.format_exc()}")
        return {
            'success': False,
            'participant': None,
            'od_list': None,
            'message': f'Error creating participant: {str(e)}'
        }

def get_participant_qr_status(participant):
    """
    Get QR email status for a participant.

    Args:
        participant: Participant instance

    Returns:
        dict: {'status': str, 'od_exists': bool, 'qr_sent': bool, 'color': str}
    """
    try:
        od_list = ODList.objects.get(participant=participant)
        if od_list.qr_sent:
            return {
                'status': 'Sent',
                'od_exists': True,
                'qr_sent': True,
                'color': 'green'
            }
        else:
            return {
                'status': 'Pending',
                'od_exists': True,
                'qr_sent': False,
                'color': 'orange'
            }
    except ODList.DoesNotExist:
        return {
            'status': 'No OD',
            'od_exists': False,
            'qr_sent': False,
            'color': 'red'
        }

def get_participant_qr_status_html(participant):
    """Get QR status as HTML span for admin display"""
    status_info = get_participant_qr_status(participant)
    return format_html(
        '<span style="color: {};">{} {}</span>',
        status_info['color'],
        '✅' if status_info['qr_sent'] else ('❌' if not status_info['od_exists'] else '⏳'),
        status_info['status']
    )

def get_current_time():
    """
    Get current timezone-aware datetime.

    Returns:
        datetime: Current time in UTC timezone
    """
    from django.utils import timezone
    return timezone.now()

def extract_user_info(user):
    """
    Extract user information for CSV/reporting purposes.

    Args:
        user: User instance

    Returns:
        dict: User information dictionary
    """
    profile = getattr(user, 'profile', None)

    return {
        'name': f"{user.first_name} {user.last_name}".strip() or user.username,
        'email': user.email or 'Unknown',
        'roll_no': profile.rollno if profile else _extract_rollno_from_email(user.email),
        'degree': profile.degree if profile and profile.degree else 'Unknown',
        'year': profile.year if profile and profile.year else _extract_year_from_email(user.email),
        'department': profile.department if profile and profile.department else 'Unknown',
        'college': profile.college_name if profile else 'Unknown',
        'phone': profile.phone_number if profile else 'Unknown'
    }

def format_csv_row(participant, event, idx):
    """
    Format participant data for CSV row.

    Args:
        participant: Participant instance
        event: Event instance
        idx: Row index

    Returns:
        list: CSV row data
    """
    user_info = extract_user_info(participant.user)

    reg_date = participant.registered_at.strftime('%Y-%m-%d %H:%M') if hasattr(participant, 'registered_at') and participant.registered_at else 'Unknown'
    # Check attendance using prefetched related manager if present, otherwise query
    try:
        od_entry = participant.registered_participants.first()
    except Exception:
        od_entry = ODList.objects.filter(participant=participant).first()
    attendance_status = 'Present' if od_entry and od_entry.attendance else 'Absent'
    payment_status = 'Paid' if participant.payment_status else 'Unpaid' if event.payment_type == 'paid' else 'Unknown'
    team_name = 'Unknown'  # team_name field doesn't exist on Participant model
    special_reqs = 'Unknown'  # special_requirements field doesn't exist on Participant model

    return [
        idx,
        user_info['name'],
        user_info['email'],
        user_info['roll_no'],
        user_info['degree'],
        user_info['year'],
        user_info['department'],
        user_info['college'],
        user_info['phone'],
        reg_date,
        attendance_status,
        payment_status,
        team_name,
        special_reqs
    ]

def _extract_year_from_email(email):
    """Extract year from email (231001196@... -> 2023)"""
    if not email or '@' not in email:
        return 'Unknown'

    rollno_part = email.split('@')[0]
    if len(rollno_part) >= 9 and rollno_part[:2].isdigit():
        year_code = rollno_part[:2]
        return f"20{year_code}"
    return 'Unknown'

def _extract_rollno_from_email(email):
    """Extract roll number from email"""
    if not email or '@' not in email:
        return 'Unknown'
    return email.split('@')[0]

def create_error_response(message, status_code=500, error_type='error'):
    """
    Create standardized error response.

    Args:
        message: Error message
        status_code: HTTP status code
        error_type: Type of error ('error', 'validation_error', etc.)

    Returns:
        Response: DRF Response object
    """
    from rest_framework.response import Response
    from rest_framework import status

    status_map = {
        400: status.HTTP_400_BAD_REQUEST,
        401: status.HTTP_401_UNAUTHORIZED,
        403: status.HTTP_403_FORBIDDEN,
        404: status.HTTP_404_NOT_FOUND,
        409: status.HTTP_409_CONFLICT,
        500: status.HTTP_500_INTERNAL_SERVER_ERROR
    }

    http_status = status_map.get(status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        error_type: message
    }, status=http_status)

def create_success_response(message=None, data=None, status_code=200):
    """
    Create standardized success response.

    Args:
        message: Success message (optional)
        data: Response data (optional)
        status_code: HTTP status code

    Returns:
        Response: DRF Response object
    """
    from rest_framework.response import Response
    from rest_framework import status

    status_map = {
        200: status.HTTP_200_OK,
        201: status.HTTP_201_CREATED,
        204: status.HTTP_204_NO_CONTENT
    }

    http_status = status_map.get(status_code, status.HTTP_200_OK)

    response_data = {'success': True}
    if message:
        response_data['message'] = message
    if data:
        response_data['data'] = data

    return Response(response_data, status=http_status)