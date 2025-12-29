from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from .models import Event, Participant, ODList, EventGuide, EventQuestion
from .serializers import EventSerializer, EventListSerializer, ParticipantSerializer, EventGuideSerializer, EventQuestionSerializer, FormResponseSerializer
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework import serializers
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from .email_services import create_participant_with_od, format_csv_row, create_error_response, create_success_response, _extract_year_from_email
from django.db.models import Q
from django.http import HttpResponse
import csv
from collections import defaultdict
from authentication.models import UserProfile

User = get_user_model()


class IsEventStaffOrAdmin(BasePermission):
    """
    Custom permission to allow event staff or admin users.
    Checks both Django's is_staff/is_superuser and UserProfile's is_eventStaff.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check Django admin permissions
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Check UserProfile event staff permission
        try:
            profile = request.user.profile
            return profile.is_eventStaff
        except UserProfile.DoesNotExist:
            return False


class IsQRScannerOrAdmin(BasePermission):
    """
    Custom permission to allow QR scanner users or admin users.
    Checks Django's is_staff/is_superuser and UserProfile's is_qr_scanner.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check Django admin permissions
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Check UserProfile QR scanner permission
        try:
            profile = request.user.profile
            return profile.is_qr_scanner
        except UserProfile.DoesNotExist:
            return False

class EventPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# ========== CLASS-BASED VIEWS ==========

class EventListAPIView(APIView):
    """
    List all events with filtering and pagination
    GET /api/events/v2/
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            events = Event.objects.all()
            
            event_type = request.GET.get('event_type')
            if event_type:
                events = events.filter(event_type=event_type)
            
            payment_type = request.GET.get('payment_type')
            if payment_type:
                events = events.filter(payment_type=payment_type)
            
            participation_type = request.GET.get('participation_type')
            if participation_type:
                events = events.filter(participation_type=participation_type)
            
            is_upcoming = request.GET.get('is_upcoming')
            if is_upcoming and is_upcoming.lower() == 'true':
                now = timezone.now()
                events = events.filter(event_date__gt=now)

            elif is_upcoming and is_upcoming.lower() == 'false':
                now = timezone.now()
                events = events.filter(event_date__lte=now)
            
            search = request.GET.get('search')
            if search:
                events = events.filter(
                    Q(event_name__icontains=search) | 
                    Q(description__icontains=search)
                )
            
            is_active = request.GET.get('is_active')
            if is_active and is_active.lower() == 'true':
                events = events.filter(is_active=True)
            elif is_active and is_active.lower() == 'false':
                events = events.filter(is_active=False)
            
            paginator = EventPagination()
            paginated_events = paginator.paginate_queryset(events, request)

            serializer = EventListSerializer(paginated_events, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
            
        except Exception as e:
            return create_error_response(f'Failed to fetch events: {str(e)}', 500)

class EventDetailAPIView(APIView):
    """
    Retrieve a specific event by ID
    GET /api/events/v2/{id}/
    """
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        try:
            event = get_object_or_404(Event, pk=pk)
            serializer = EventSerializer(event, context={'request': request})
            return create_success_response(data=serializer.data)
            
        except Exception as e:
            return create_error_response(f'Failed to fetch event: {str(e)}', 500)

class EventCreateAPIView(APIView):
    """
    Create a new event (Admin only)
    POST /api/events/v2/create/
    """

    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            with transaction.atomic():
                questions_data = request.data.get('questions', [])
                
                if isinstance(questions_data, str):
                    import json
                    try:
                        questions_data = json.loads(questions_data)
                    except json.JSONDecodeError as e:
                        return Response({
                            'error': f'Invalid JSON format for questions data: {str(e)}'
                        }, status=status.HTTP_400_BAD_REQUEST)

                # Convert QueryDict to regular dict and handle list values
                event_data = {}
                for key, value in request.data.items():
                    if key == 'questions':
                        continue
                    # Get the first value if it's a list, since QueryDict values are always lists
                    event_data[key] = value[0] if isinstance(value, (list, tuple)) else value

                # Parse require_registration_form if it's a string
                if 'require_registration_form' in event_data:
                    if isinstance(event_data['require_registration_form'], str):
                        event_data['require_registration_form'] = event_data['require_registration_form'].lower() == 'true'

                serializer = EventSerializer(data=event_data, context={'request': request})
                if serializer.is_valid():
                    event = serializer.save()

                    # Handle questions if require_registration_form is True
                    if event.require_registration_form and questions_data:
                        if not isinstance(questions_data, list):
                            questions_data = [questions_data]

                        for idx, question_data in enumerate(questions_data):
                            question_data['event'] = event.id
                            if 'order' not in question_data:
                                question_data['order'] = idx
                            question_serializer = EventQuestionSerializer(data=question_data)
                            if question_serializer.is_valid():
                                question_serializer.save()
                            else:
                                raise serializers.ValidationError(f"Question {idx + 1} validation error: {question_serializer.errors}")

                    # Re-fetch the event to ensure we have the latest data including questions
                    event.refresh_from_db()
                    response_data = EventSerializer(event, context={'request': request}).data
                    return Response({
                        'success': True,
                        'message': 'Event created successfully',
                        'data': response_data
                    }, status=status.HTTP_201_CREATED)

                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {'error': f'Failed to create event: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EventUpdateAPIView(APIView):
    """
    Update an existing event (Admin only)
    PUT /api/events/v2/{id}/update/
    PATCH /api/events/v2/{id}/update/
    """

    permission_classes = [IsAuthenticated]
    
    def put(self, request, pk):
        return self._update_event(request, pk, partial=False)
    
    def patch(self, request, pk):
        return self._update_event(request, pk, partial=True)
    
    def _update_event(self, request, pk, partial=False):
        try:
            with transaction.atomic():
                event = get_object_or_404(Event, pk=pk)
                serializer = EventSerializer(event, data=request.data, partial=partial, context={'request': request})

                if serializer.is_valid():
                    event = serializer.save()

                    # Handle registration form toggle and questions
                    new_require_registration = request.data.get('require_registration_form', event.require_registration_form)
                    
                    if not new_require_registration:
                        # If registration form is being disabled, delete all questions
                        EventQuestion.objects.filter(event=event).delete()
                    elif new_require_registration:
                        questions_data = request.data.get('questions', [])
                        if questions_data:
                            # Delete existing questions and create new ones
                            EventQuestion.objects.filter(event=event).delete()
                            # Create new questions
                            for idx, question_data in enumerate(questions_data):
                                question_data['event'] = event.id
                                if 'order' not in question_data:
                                    question_data['order'] = idx
                                question_serializer = EventQuestionSerializer(data=question_data)
                                if question_serializer.is_valid():
                                    question_serializer.save()
                                else:
                                    raise serializers.ValidationError(f"Question {idx + 1} validation error: {question_serializer.errors}")
                        # If no questions provided but require_registration_form is True, keep existing questions

                    return Response({
                        'success': True,
                        'message': 'Event updated successfully',
                        'data': EventSerializer(event, context={'request': request}).data
                    }, status=status.HTTP_200_OK)

                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {'error': f'Failed to update event: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EventDeleteAPIView(APIView):
    """
    Delete an event (Admin only)
    DELETE /api/events/v2/{id}/delete/
    """

    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        try:
            event = get_object_or_404(Event, pk=pk)
            event_name = event.event_name
            event.delete()
            
            return Response({
                'success': True,
                'message': f'Event "{event_name}" deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to delete event: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UpcomingEventsAPIView(APIView):
    """
    Get upcoming events with filtering
    GET /api/events/v2/upcoming/
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            now = timezone.now()
            events = Event.objects.filter(
                event_date__gt=now,
                is_active=True
            ).order_by('event_date')
        
            event_type = request.GET.get('event_type')
            if event_type:
                events = events.filter(event_type=event_type)
            
            search = request.GET.get('search')
            if search:
                events = events.filter(
                    Q(event_name__icontains=search) | 
                    Q(description__icontains=search)
                )
            
            paginator = EventPagination()
            paginated_events = paginator.paginate_queryset(events, request)

            serializer = EventListSerializer(paginated_events, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch upcoming events: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ========== PARTICIPANT REGISTRATION VIEWS ==========

class EventRegistrationAPIView(APIView):
    """
    Register user for an event with no time clash
    POST /api/events/<event_id>/register/
    Body: {
        "answers": [
            {"question": 1, "value": "John Doe"},
            {"question": 2, "value": ["Option A", "Option B"]}
        ]
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, event_id):
        try:
            event = get_object_or_404(Event, pk=event_id, is_active=True)

            # Check if registration is still open
            if not event.is_registration_open:
                return Response({'error': 'Registration is closed for this event'}, status=status.HTTP_400_BAD_REQUEST)

            if Participant.objects.filter(user=request.user, event=event).exists():
                return Response({'error': 'Already registered'}, status=status.HTTP_400_BAD_REQUEST)

            clash_type, clash_message = event.check_time_clash(request.user)
            if clash_type == 'block':
                return Response({
                    'error': 'Registration blocked due to time clash',
                    'message': clash_message,
                    'clash_type': 'block'
                }, status=status.HTTP_409_CONFLICT)

            # Validate and process answers
            answers_data = request.data.get('answers', [])
            questions = EventQuestion.objects.filter(event=event).order_by('order', 'id')
            if questions.exists():
                validation_result = self._validate_answers(answers_data, questions)
                if not validation_result['valid']:
                    return Response({'error': validation_result['error']}, status=status.HTTP_400_BAD_REQUEST)
                answers_snapshot = validation_result['answers_snapshot']
            else:
                answers_snapshot = []

            if event.payment_type == 'paid':
                # Create participant with payment_status=False for paid events
                result = create_participant_with_od(request.user, event, send_email=False, answers=answers_snapshot, payment_status=False)
                if result['success']:
                    response_data = {
                        'success': True,
                        'message': 'Registration initiated. Payment required to complete registration.',
                        'participant_id': result.get('participant').id if result.get('participant') else None,
                        'payment_required': True
                    }
                    if clash_type == 'warn':
                        response_data['warning'] = clash_message
                        response_data['clash_type'] = 'warn'
                    return Response(response_data, status=status.HTTP_201_CREATED)
                else:
                    return Response({'error': result['message']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                # Free event: create participant as usual
                result = create_participant_with_od(request.user, event, send_email=True, answers=answers_snapshot)
                if result['success']:
                    response_data = {
                        'success': True,
                        'message': result['message'],
                        'participant_id': result.get('participant').id if result.get('participant') else None
                    }
                    if clash_type == 'warn':
                        response_data['warning'] = clash_message
                        response_data['clash_type'] = 'warn'
                    return Response(response_data, status=status.HTTP_201_CREATED)
                else:
                    return Response({'error': result['message']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _validate_answers(self, answers_data, questions):
        """Validate user's answers against event questions"""
        qmap = {q.id: q for q in questions}
        required_ids = {q.id for q in questions if q.required}
        provided_ids = set()
        normalized_answers = []
        
        for item in answers_data:
            qid = item.get('question')
            if qid not in qmap:
                return {'valid': False, 'error': f'Invalid question id: {qid}'}
            
            q = qmap[qid]
            val = item.get('value', None)
            
            if q.question_type in ['short_text', 'long_text', 'email', 'phone']:
                if not isinstance(val, str):
                    return {'valid': False, 'error': f'Question "{q.label}" expects text'}
            elif q.question_type == 'number':
                if not isinstance(val, (int, float)):
                    return {'valid': False, 'error': f'Question "{q.label}" expects a number'}
            elif q.question_type == 'date':
                if not isinstance(val, str):
                    return {'valid': False, 'error': f'Question "{q.label}" expects a date string'}
            elif q.question_type == 'single_choice':
                if not isinstance(val, str):
                    return {'valid': False, 'error': f'Question "{q.label}" expects a single option'}
                if q.options and val not in q.options:
                    return {'valid': False, 'error': f'Question "{q.label}" has invalid option'}
            elif q.question_type == 'multi_choice':
                if not isinstance(val, list) or not all(isinstance(x, str) for x in val):
                    return {'valid': False, 'error': f'Question "{q.label}" expects a list of options'}
                if q.options and not set(val).issubset(set(q.options)):
                    return {'valid': False, 'error': f'Question "{q.label}" contains invalid options'}
            elif q.question_type == 'file':
                if not isinstance(val, str):  # File should be uploaded and stored, returning a URL/path string
                    return {'valid': False, 'error': f'Question "{q.label}" expects a file'}
                
                allowed_extensions = q.help_text.split(',') if q.help_text else []
                if allowed_extensions:
                    file_extension = val.split('.')[-1].lower()
                    if file_extension not in [ext.strip().lower() for ext in allowed_extensions]:
                        return {'valid': False, 'error': f'Question "{q.label}" only accepts files with extensions: {q.help_text}'}
            
            provided_ids.add(qid)
            normalized_answers.append((q, val))
        
        missing = required_ids - provided_ids
        if missing:
            missing_labels = [qmap[qid].label for qid in missing]
            return {'valid': False, 'error': f'Missing required questions: {", ".join(missing_labels)}'}
        
        answers = [
            {
                'question': q.id,
                'label': q.label,
                'type': q.question_type,
                'value': val
            }
            for q, val in normalized_answers
        ]
        
        return {'valid': True, 'answers_snapshot': answers}


class EventRegistrationStatusAPIView(APIView):
    """
    Check user's registration status for an event
    GET /api/events/<event_id>/registration-status/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        """Get user's registration status for an event"""
        try:
            event = get_object_or_404(Event, id=event_id)
            
            try:
                participant = Participant.objects.get(user=request.user, event=event)
                return Response({
                    'is_registered': True,
                    'registration_status': participant.registration_status,
                    'payment_status': participant.payment_status,
                    'registered_at': participant.registered_at,
                    'registration': {
                        'hash': participant.registered_participants.first().hash if participant.registered_participants.exists() else None
                    }
                })
            except Participant.DoesNotExist:
                return Response({
                    'is_registered': False,
                    'can_register': event.is_registration_open,
                    'message': 'Not registered for this event'
                })
                
        except Exception as e:
            return Response(
                {'error': f'Failed to check registration status: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EventAdminUnregisterAPIView(APIView):
    """
    Admin endpoint to unregister a user from an event
    DELETE /api/events/<event_id>/admin-unregister/
    """
    permission_classes = [IsEventStaffOrAdmin]

    def delete(self, request, event_id):
        """Admin unregister a specific user from an event"""
        try:
            event = get_object_or_404(Event, id=event_id)
            user_id = request.data.get('user_id')

            if not user_id:
                return Response(
                    {'error': 'user_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                user = User.objects.get(pk=user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            try:
                participant = Participant.objects.get(user=user, event=event)

                participant.delete()

                return Response({
                    'success': True,
                    'message': f'Successfully unregistered {user.get_full_name() or user.username} from {event.event_name}'
                }, status=status.HTTP_200_OK)

            except Participant.DoesNotExist:
                return Response({
                    'success': False,
                    'message': f'{user.get_full_name() or user.username} is not registered for this event'
                }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response(
                {'error': f'Failed to unregister from event: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserRegistrationsAPIView(APIView):
    """
    Get all registrations for the authenticated user
    GET /api/user/registrations/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all event registrations for authenticated user"""
        try:
            participants = Participant.objects.filter(user=request.user).select_related('event')

            status_filter = request.GET.get('status')
            if status_filter:
                participants = participants.filter(registration_status=status_filter)

            upcoming_only = request.GET.get('upcoming_only', 'false').lower() == 'true'
            if upcoming_only:
                now = timezone.now()
                participants = participants.filter(event__event_date__gte=now)

            paginator = EventPagination()
            paginated_participants = paginator.paginate_queryset(participants, request)

            # Use the full ParticipantSerializer to include event details
            serializer = ParticipantSerializer(paginated_participants, many=True, context={'request': request})

            return paginator.get_paginated_response(serializer.data)

        except Exception as e:
            return Response(
                {'error': f'Failed to fetch user registrations: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EventParticipantsAPIView(APIView):
    """
    Get all participants for an event (Admin only)
    GET /api/events/<event_id>/participants/
    """
    permission_classes = [IsEventStaffOrAdmin]
    
    def get(self, request, event_id):
        """Get all participants for an event"""
        try:
            event = get_object_or_404(Event, id=event_id)

            participants = (
                Participant.objects
                .filter(event=event)
                .select_related('user')
                .prefetch_related('registered_participants')
            )

            status_filter = request.GET.get('status')
            if status_filter:
                participants = participants.filter(registration_status=status_filter)

            attended_filter = request.GET.get('attendance')
            if attended_filter is not None:
                attended_bool = attended_filter.lower() == 'true'

                attended_participant_ids = ODList.objects.filter(
                    event=event,
                    attendance=True
                ).values_list('participant_id', flat=True)

                if attended_bool:
                    participants = participants.filter(id__in=attended_participant_ids)
                else:
                    participants = participants.exclude(id__in=attended_participant_ids)

            paginator = EventPagination()
            paginated_participants = paginator.paginate_queryset(participants, request)

            serializer = ParticipantSerializer(paginated_participants, many=True)
            return paginator.get_paginated_response(serializer.data)

        except Exception as e:
            return Response(
                {'error': f'Failed to fetch event participants: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InternalBookingAPIView(APIView):
    """
    Admin endpoint to internally book participants for events, bypassing payment gateway
    POST /api/events/<event_id>/internal-book/
    """
    permission_classes = [IsAdminUser]

    def post(self, request, event_id):
        """Add a participant to event with payment bypass (Admin only)"""
        try:
            event = get_object_or_404(Event, pk=event_id, is_active=True)

            # Check if registration is still open
            if not event.is_registration_open:
                return Response({'error': 'Registration is closed for this event'}, status=status.HTTP_400_BAD_REQUEST)

            user_id = request.data.get('user_id')
            user_data = request.data.get('user_data') or request.data

            if user_id:
                try:
                    user = User.objects.get(pk=user_id)
                except User.DoesNotExist:
                    return Response(
                        {'error': 'User not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            elif user_data and 'email' in user_data:
                email = user_data.get('email')
                first_name = user_data.get('first_name', '')
                last_name = user_data.get('last_name', '')

                # Check if user already exists
                existing_user = User.objects.filter(email=email).first()
                if existing_user:
                    # User exists, just register them for the event
                    user = existing_user
                else:
                    # Create new user
                    username = email.split('@')[0]
                    base_username = username
                    counter = 1
                    while User.objects.filter(username=username).exists():
                        username = f"{base_username}{counter}"
                        counter += 1

                    # Generate password based on available data
                    if user_data.get('rollno'):
                        # Use roll number if available
                        password = f"{username}@{user_data['rollno']}"
                    else:
                        # Use firstname+lastname if no roll number
                        password = f"{first_name.lower()}{last_name.lower()}@{username}"

                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        password=password
                    )

                    # Create user profile for new user only
                    from authentication.models import UserProfile
                    profile_data = {
                        'user': user,
                        'is_staff': False,
                        'is_verified': True,
                    }

                    # Add optional profile fields
                    if user_data.get('rollno'):
                        profile_data['rollno'] = user_data['rollno']
                    if user_data.get('department'):
                        profile_data['department'] = user_data['department']
                    if user_data.get('degree'):
                        profile_data['degree'] = user_data['degree']
                    if user_data.get('college_name'):
                        profile_data['college_name'] = user_data['college_name']
                    if user_data.get('phone_number'):
                        profile_data['phone_number'] = user_data['phone_number']

                    # Create profile without setting is_profile_complete (it's a property)
                    UserProfile.objects.create(**profile_data)
            else:
                return Response(
                    {'error': 'Either user_id or complete user data (including email) is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            result = create_participant_with_od(user, event, send_email=True)

            if result['success']:
                participant = result['participant']
                od_list = result['od_list']
                return Response({
                    'success': True,
                    'message': f'{user.get_full_name() or user.username} for {event.event_name}: {result["message"]}',
                    'participant_id': participant.id if participant else None,
                    'od_list_id': od_list.id if od_list else None
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'error': result['message']
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            import traceback
            print(f"Internal booking error: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {'error': f'Failed to process internal booking: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EventAnalysisDownloadAPIView(APIView):
    """
    Download comprehensive event analysis as CSV (Admin only)
    GET /api/events/<event_id>/analysis/download/
    """
    permission_classes = [IsEventStaffOrAdmin]

    def get(self, request, event_id):
        """Generate and download event analysis CSV"""
        try:
            event = get_object_or_404(Event, id=event_id)

            now = timezone.now()
            if event.event_date > now:
                return Response(
                    {'error': 'Analysis only available for completed events'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            participants = Participant.objects.filter(event=event).select_related(
                'user', 'user__profile'
            ).prefetch_related('registered_participants')

            if not participants.exists():
                return Response(
                    {'error': 'No participants found for this event'},
                    status=status.HTTP_404_NOT_FOUND
                )

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{event.event_name}_analysis_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'

            writer = csv.writer(response)

            self._write_analysis_to_csv(writer, event, participants)

            return response

        except Exception as e:
            return Response(
                {'error': f'Failed to generate analysis: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EventODListAPIView(APIView):
    """
    Get event OD list data as JSON (Admin/Staff only)
    GET /api/events/<event_id>/od-list/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        """Return event OD list data as JSON."""
        try:
            print(f"[OD_LIST_JSON_DEBUG] Starting OD list JSON fetch for event_id: {event_id}")
            print(f"[OD_LIST_JSON_DEBUG] User: {request.user.username}, is_staff: {request.user.is_staff}, is_superuser: {request.user.is_superuser}")

            # Check if user has event staff permissions or is superuser
            try:
                user_profile = request.user.profile
                has_permission = user_profile.is_eventStaff or request.user.is_superuser
            except UserProfile.DoesNotExist:
                has_permission = request.user.is_superuser

            if not has_permission:
                print(f"[OD_LIST_JSON_DEBUG] Access denied - user does not have event staff permissions")
                return Response(
                    {'error': 'Only staff members can view OD lists'},
                    status=status.HTTP_403_FORBIDDEN
                )

            event = get_object_or_404(Event, id=event_id)
            print(f"[OD_LIST_JSON_DEBUG] Event found: {event.event_name} (ID: {event.id})")

            # Get all ODList entries for the event
            od_list_entries = (
                ODList.objects.filter(event=event)
                .select_related('participant', 'participant__user', 'participant__user__profile')
                .order_by('participant__user__first_name', 'participant__user__last_name')
            )
            print(f"[OD_LIST_JSON_DEBUG] Found {od_list_entries.count()} OD list entries")

            # Format data for frontend
            od_list_data = []
            for od_entry in od_list_entries:
                participant = od_entry.participant
                profile = getattr(participant.user, 'profile', None)

                od_list_data.append({
                    'id': od_entry.id,
                    'user_id': participant.user.id,
                    'user_name': f"{participant.user.first_name} {participant.user.last_name}".strip() or participant.user.username,
                    'user_email': participant.user.email,
                    'user_phone': profile.phone_number if profile and profile.phone_number else '',
                    'user_college': profile.college_name if profile and profile.college_name else '',
                    'user_department': profile.department if profile and profile.department else '',
                    'user_year': profile.year if profile and profile.year else '',
                    'attended': od_entry.attendance,
                    'registration_date': participant.registered_at.isoformat() if participant.registered_at else None
                })

            print(f"[OD_LIST_JSON_DEBUG] Returning {len(od_list_data)} OD list entries")
            return Response({
                'event_id': event.id,
                'event_name': event.event_name,
                'od_list': od_list_data,
                'total_count': len(od_list_data)
            })

        except Exception as e:
            print(f"[OD_LIST_JSON_DEBUG] Error in OD list JSON fetch: {str(e)}")
            import traceback
            print(f"[OD_LIST_JSON_DEBUG] Full traceback: {traceback.format_exc()}")
            return Response(
                {'error': f'Failed to fetch OD list: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EventODListDownloadAPIView(APIView):
    """
    Download event OD list as CSV (Admin/Staff only)
    GET /api/events/<event_id>/od-list/download/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        """Generate and download event OD list CSV (only for attended participants)."""
        try:
            print(f"[OD_LIST_DEBUG] Starting OD list download for event_id: {event_id}")
            print(f"[OD_LIST_DEBUG] User: {request.user.username}, is_staff: {request.user.is_staff}, is_superuser: {request.user.is_superuser}")

            # Check if user has event staff permissions or is superuser
            try:
                user_profile = request.user.profile
                has_permission = user_profile.is_eventStaff or request.user.is_superuser
            except UserProfile.DoesNotExist:
                has_permission = request.user.is_superuser

            if not has_permission:
                print(f"[OD_LIST_DEBUG] Access denied - user does not have event staff permissions")
                return Response(
                    {'error': 'Only staff members can download OD lists'},
                    status=status.HTTP_403_FORBIDDEN
                )

            event = get_object_or_404(Event, id=event_id)
            print(f"[OD_LIST_DEBUG] Event found: {event.event_name} (ID: {event.id})")

            # Get all ODList entries for the event (not just attended ones)
            od_list_entries = (
                ODList.objects.filter(event=event)
                .select_related('participant', 'participant__user', 'participant__user__profile')
                .order_by('participant__user__first_name', 'participant__user__last_name')
            )
            print(f"[OD_LIST_DEBUG] Found {od_list_entries.count()} OD list entries")

            if not od_list_entries.exists():
                print(f"[OD_LIST_DEBUG] No participants registered for event {event_id}")
                return Response(
                    {'error': 'No participants registered for this event'},
                    status=status.HTTP_404_NOT_FOUND
                )

            print(f"[OD_LIST_DEBUG] Generating CSV for {od_list_entries.count()} participants")
            response = HttpResponse(content_type='text/csv')
            filename = f"{event.event_name}_od_list_{timezone.now().strftime('%Y%m%d_%H%M%S')}.csv"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            print(f"[OD_LIST_DEBUG] CSV filename: {filename}")

            writer = csv.writer(response)
            self._write_od_list_to_csv(writer, event, od_list_entries)
            print(f"[OD_LIST_DEBUG] CSV generation completed successfully")

            return response

        except Exception as e:
            print(f"[OD_LIST_DEBUG] Error in OD list download: {str(e)}")
            import traceback
            print(f"[OD_LIST_DEBUG] Full traceback: {traceback.format_exc()}")
            return Response(
                {'error': f'Failed to generate OD list: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _write_od_list_to_csv(self, writer, event, od_list_entries):
        """Write event OD list to CSV"""
        print(f"[OD_LIST_DEBUG] Writing CSV for event: {event.event_name}")
        print(f"[OD_LIST_DEBUG] Number of OD list entries to write: {od_list_entries.count()}")

        # Header
        writer.writerow([f'{event.event_name} - OD list'])
        writer.writerow([])  # Empty row

        # Column headers
        writer.writerow([
            'Username',
            'User Email',
            'Roll Number',
            'Degree',
            'Year',
            'Department',
            'College Name',
            'Attended'
        ])
        print(f"[OD_LIST_DEBUG] CSV headers written")

        # OD list entry data
        entry_count = 0
        for od_entry in od_list_entries:
            participant = od_entry.participant
            profile = getattr(participant.user, 'profile', None)
            entry_count += 1

            row_data = [
                participant.user.username,
                participant.user.email,
                profile.rollno if profile else 'Unknown',
                profile.degree if profile and profile.degree else 'Unknown',
                profile.year if profile and profile.year else 'Unknown',
                profile.department if profile and profile.department else 'Unknown',
                profile.college_name if profile else 'Unknown',
                'Yes' if od_entry.attendance else 'No'
            ]

            writer.writerow(row_data)
            print(f"[OD_LIST_DEBUG] Wrote row {entry_count}: {row_data}")

        print(f"[OD_LIST_DEBUG] Completed writing {entry_count} OD list entries to CSV")
    
    def _write_analysis_to_csv(self, writer, event, participants):
        """Write comprehensive event analysis to CSV"""
        
        # SECTION 1: Event Summary
        writer.writerow(['=' * 80])
        writer.writerow([f'EVENT ANALYSIS REPORT: {event.event_name}'])
        writer.writerow(['=' * 80])
        writer.writerow(['Generated on:', timezone.now().strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow(['Event Date:', event.event_date.strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow(['Event Type:', event.get_event_type_display()])
        writer.writerow(['Payment Type:', event.get_payment_type_display()])
        writer.writerow(['Participation Type:', event.get_participation_type_display()])
        writer.writerow([])
        
        # Calculate summary statistics using ODList for attendance
        total_registered = participants.count()
        
        # Get attendance from ODList
        attended_participants = ODList.objects.filter(
            participant__event=event,
            attendance=True
        ).count()
        
        total_present = attended_participants
        total_absent = total_registered - total_present
        attendance_rate = (total_present / total_registered * 100) if total_registered > 0 else 0
        
        writer.writerow(['📊 EVENT SUMMARY'])
        writer.writerow(['-' * 40])
        writer.writerow(['Total Registrations:', total_registered])
        writer.writerow(['Total Present:', total_present])
        writer.writerow(['Total Absent:', total_absent])
        writer.writerow(['Attendance Rate:', f'{attendance_rate:.2f}%'])
        writer.writerow([])
        
        # SECTION 2: Department-wise Analysis
        writer.writerow(['🏛️ DEPARTMENT-WISE ANALYSIS'])
        writer.writerow(['-' * 50])
        writer.writerow(['Department', 'Registered', 'Present', 'Absent', 'Attendance %'])
        
        dept_stats = self._get_department_stats(participants)
        for dept, stats in dept_stats.items():
            attendance_pct = (stats['present'] / stats['total'] * 100) if stats['total'] > 0 else 0
            writer.writerow([
                dept, 
                stats['total'], 
                stats['present'], 
                stats['absent'], 
                f'{attendance_pct:.1f}%'
            ])
        writer.writerow([])
        
        # SECTION 3: Year-wise Analysis
        writer.writerow(['📅 YEAR-WISE ANALYSIS'])
        writer.writerow(['-' * 40])
        writer.writerow(['Year', 'Registered', 'Present', 'Absent', 'Attendance %'])
        
        year_stats = self._get_year_stats(participants)
        for year, stats in sorted(year_stats.items()):
            attendance_pct = (stats['present'] / stats['total'] * 100) if stats['total'] > 0 else 0
            writer.writerow([
                year, 
                stats['total'], 
                stats['present'], 
                stats['absent'], 
                f'{attendance_pct:.1f}%'
            ])
        writer.writerow([])
        
        # SECTION 4: College-wise Analysis
        writer.writerow(['🏫 COLLEGE-WISE ANALYSIS'])
        writer.writerow(['-' * 40])
        writer.writerow(['College', 'Registered', 'Present', 'Absent', 'Attendance %'])
        
        college_stats = self._get_college_stats(participants)
        for college, stats in college_stats.items():
            attendance_pct = (stats['present'] / stats['total'] * 100) if stats['total'] > 0 else 0
            writer.writerow([
                college, 
                stats['total'], 
                stats['present'], 
                stats['absent'], 
                f'{attendance_pct:.1f}%'
            ])
        writer.writerow([])
        
        # SECTION 5: Payment Analysis (if applicable)
        if event.payment_type == 'paid':
            writer.writerow(['💳 PAYMENT ANALYSIS'])
            writer.writerow(['-' * 30])
            paid_count = participants.filter(payment_status=True).count()
            unpaid_count = participants.filter(payment_status=False).count()
            payment_rate = (paid_count / total_registered * 100) if total_registered > 0 else 0
            
            writer.writerow(['Total Paid:', paid_count])
            writer.writerow(['Total Unpaid:', unpaid_count])
            writer.writerow(['Payment Rate:', f'{payment_rate:.2f}%'])
            writer.writerow([])
        
        # SECTION 6: Complete Participants List
        writer.writerow(['👥 COMPLETE PARTICIPANTS LIST'])
        writer.writerow(['=' * 80])
        writer.writerow([
            'S.No', 'Name', 'Email', 'Roll No', 'Degree', 'Year', 'Department',
            'College', 'Phone', 'Registration Date', 'Attendance Status',
            'Payment Status', 'Team Name', 'Special Requirements'
        ])
        
        for idx, participant in enumerate(participants.order_by('user__first_name'), 1):
            row_data = format_csv_row(participant, event, idx)
            writer.writerow(row_data)
    
    def _get_department_stats(self, participants):
        """Calculate department-wise statistics"""
        dept_stats = defaultdict(lambda: {'total': 0, 'present': 0, 'absent': 0})
        
        for participant in participants:
            profile = getattr(participant.user, 'profile', None)
            dept = profile.get_department_display() if profile and profile.department else 'Unknown'
            
            dept_stats[dept]['total'] += 1
            
            # Check attendance from prefetched ODList data
            od_entry = participant.registered_participants.first()
            if od_entry and od_entry.attendance:
                dept_stats[dept]['present'] += 1
            else:
                dept_stats[dept]['absent'] += 1
        
        return dict(dept_stats)
    
    def _get_year_stats(self, participants):
        """Calculate year-wise statistics"""
        year_stats = defaultdict(lambda: {'total': 0, 'present': 0, 'absent': 0})
        
        for participant in participants:
            year = _extract_year_from_email(participant.user.email)
            
            year_stats[year]['total'] += 1
            
            # Check attendance from prefetched ODList data
            od_entry = participant.registered_participants.first()
            if od_entry and od_entry.attendance:
                year_stats[year]['present'] += 1
            else:
                year_stats[year]['absent'] += 1
        
        return dict(year_stats)
    
    def _get_college_stats(self, participants):
        """Calculate college-wise statistics"""
        college_stats = defaultdict(lambda: {'total': 0, 'present': 0, 'absent': 0})
        
        for participant in participants:
            profile = getattr(participant.user, 'profile', None)
            college = profile.college_name if profile else 'Unknown'
            
            college_stats[college]['total'] += 1
            
            # Check attendance from prefetched ODList data
            od_entry = participant.registered_participants.first()
            if od_entry and od_entry.attendance:
                college_stats[college]['present'] += 1
            else:
                college_stats[college]['absent'] += 1
        
        return dict(college_stats)


# ========== EVENT GUIDE ENDPOINTS ==========

class EventGuideDetailAPIView(APIView):
    """
    Get event guide details by event ID (Public endpoint)
    GET /api/events/<int:event_id>/eventdesc/
    """
    permission_classes = [AllowAny]
    
    def get(self, request, event_id):
        try:
            event = get_object_or_404(Event, id=event_id)
            
            try:
                event_guide = event.guide
            except:
                return Response(
                    {"detail": "Event guide not found for this event"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = EventGuideSerializer(event_guide)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EventGuideCreateUpdateAPIView(APIView):
    """
    Create or update event guide (Admin only)
    POST/PUT /api/events/<int:event_id>/eventdesc/admin/
    """
    permission_classes = [IsEventStaffOrAdmin]
    
    def post(self, request, event_id):
        """Create new event guide"""
        try:
            event = get_object_or_404(Event, id=event_id)
            
            if hasattr(event, 'guide'):
                return Response(
                    {"detail": "Event guide already exists for this event. Use PUT to update."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = EventGuideSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(event=event)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request, event_id):
        """Update existing event guide"""
        try:
            event = get_object_or_404(Event, id=event_id)
            
            try:
                event_guide = event.guide
            except:
                return Response(
                    {"detail": "Event guide not found for this event. Use POST to create."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = EventGuideSerializer(event_guide, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EventQuestionsManageAPIView(APIView):
    """
    Manage event questions (Admin only)
    POST /api/events/<int:event_id>/questions/ - Create/update questions in bulk
    GET /api/events/<int:event_id>/questions/ - Get all questions for an event
    """
    
    def get_permissions(self):
        """Allow anyone to GET questions, require auth for POST"""
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get(self, request, event_id):
        """Get all questions for an event (public access)"""
        try:
            event = get_object_or_404(Event, id=event_id)
            questions = EventQuestion.objects.filter(event=event).order_by('order', 'id')
            serializer = EventQuestionSerializer(questions, many=True)
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch questions: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, event_id):
        """Create or replace all questions for an event (Admin only)"""
        try:
            event = get_object_or_404(Event, id=event_id)
            
            questions_data = request.data.get('questions', [])
            
            require_registration_form = request.data.get('requireRegistrationForm', True)
            
            if not require_registration_form:
                EventQuestion.objects.filter(event=event).delete()
                return Response({
                    'success': True,
                    'message': 'Registration form disabled and questions removed',
                    'data': []
                }, status=status.HTTP_200_OK)
            
            with transaction.atomic():

                EventQuestion.objects.filter(event=event).delete()
                
                created_questions = []
                for idx, question_data in enumerate(questions_data):
                    question_data['event'] = event.id
                    if 'order' not in question_data:
                        question_data['order'] = idx
                    
                    serializer = EventQuestionSerializer(data=question_data)
                    if serializer.is_valid():
                        question = serializer.save()
                        created_questions.append(question)
                    else:
                        return Response({
                            'error': f'Validation error in question {idx + 1}',
                            'details': serializer.errors
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                return Response({
                    'success': True,
                    'message': f'Successfully created {len(created_questions)} questions',
                    'data': EventQuestionSerializer(created_questions, many=True).data
                }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create questions: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EventQuestionDetailAPIView(APIView):
    """
    Manage individual event question (Admin only)
    PUT/PATCH /api/events/questions/<int:question_id>/ - Update question
    DELETE /api/events/questions/<int:question_id>/ - Delete question
    """
    permission_classes = [IsEventStaffOrAdmin]
    
    def put(self, request, question_id):
        """Update a specific question"""
        try:
            question = get_object_or_404(EventQuestion, id=question_id)
            serializer = EventQuestionSerializer(question, data=request.data, partial=False)
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success': True,
                    'message': 'Question updated successfully',
                    'data': serializer.data
                }, status=status.HTTP_200_OK)
            
            return Response({
                'error': 'Validation error',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to update question: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def patch(self, request, question_id):
        """Partially update a specific question"""
        try:
            question = get_object_or_404(EventQuestion, id=question_id)
            serializer = EventQuestionSerializer(question, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success': True,
                    'message': 'Question updated successfully',
                    'data': serializer.data
                }, status=status.HTTP_200_OK)
            
            return Response({
                'error': 'Validation error',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to update question: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, question_id):
        """Delete a specific question"""
        try:
            question = get_object_or_404(EventQuestion, id=question_id)
            question_label = question.label
            question.delete()
            
            return Response({
                'success': True,
                'message': f'Question "{question_label}" deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to delete question: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class Scanner(APIView):
    """
    Scan the attendance QR and mark present/absent
    PUT/PATCH /api/events/<int:event_id>/mark-attendance/
    """
    permission_classes = [IsQRScannerOrAdmin]

    def put(self, request, event_id):
        try:
            event = get_object_or_404(Event, id=event_id)
            hash_value = request.data.get('hash')

            if not hash_value:
                return Response(
                    {'error': 'Hash value is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            od_obj = ODList.objects.get(hash=hash_value, participant__event=event)
            if hash_value == od_obj.hash:
                from .serializers import ParticipantSerializer
                participant_data = ParticipantSerializer(od_obj.participant).data
                if od_obj.attendance == True:
                    return Response(
                        {
                            'message': 'Attendance was already marked',
                            'participant': participant_data
                        },
                        status=status.HTTP_208_ALREADY_REPORTED
                    )
                od_obj.attendance = True
                od_obj.attendance_marked_at = timezone.now()
                od_obj.save()
                participant_data = ParticipantSerializer(od_obj.participant).data
                return Response(
                    {
                        'message': 'Attendance marked successfully',
                        'participant': participant_data
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Invalid hash'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ODList.DoesNotExist:
            return Response(
                {'error': 'Invalid hash or participant not found for this event'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to mark attendance: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



# ========== EVENT GUIDE VIEWS ==========

class EventGuideDetailAPIView(APIView):
    """
    Get event guide details (Public)
    GET /api/events/<event_id>/eventdesc/
    """
    permission_classes = [AllowAny]

    def get(self, request, event_id):
        """Get event guide for a specific event"""
        try:
            event = get_object_or_404(Event, id=event_id)
            
            try:
                guide = event.guide
                serializer = EventGuideSerializer(guide, context={'request': request})
                return create_success_response(data=serializer.data)
            except EventGuide.DoesNotExist:
                return create_error_response('Event guide not found for this event', 404)
                
        except Exception as e:
            return create_error_response(f'Failed to fetch event guide: {str(e)}', 500)


class EventGuideCreateUpdateAPIView(APIView):
    """
    Create or update event guide (Admin only)
    POST/PUT/PATCH /api/events/<event_id>/eventdesc/admin/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        """Create event guide"""
        try:
            event = get_object_or_404(Event, id=event_id)
            
            # Check if guide already exists
            if hasattr(event, 'guide'):
                return Response({
                    'success': False,
                    'error': 'Event guide already exists. Use PUT/PATCH to update.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Add event to the data
            data = request.data.copy()
            data['event'] = event.id
            
            serializer = EventGuideSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                guide = serializer.save()
                return Response({
                    'success': True,
                    'message': 'Event guide created successfully',
                    'data': EventGuideSerializer(guide, context={'request': request}).data
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return create_error_response(f'Failed to create event guide: {str(e)}', 500)

    def put(self, request, event_id):
        """Update event guide (full update)"""
        return self._update_guide(request, event_id, partial=False)
    
    def patch(self, request, event_id):
        """Update event guide (partial update)"""
        return self._update_guide(request, event_id, partial=True)
    
    def _update_guide(self, request, event_id, partial=False):
        """Helper method to update event guide"""
        try:
            event = get_object_or_404(Event, id=event_id)
            
            try:
                guide = event.guide
            except EventGuide.DoesNotExist:
                return create_error_response('Event guide not found. Use POST to create.', 404)
            
            serializer = EventGuideSerializer(guide, data=request.data, partial=partial, context={'request': request})
            if serializer.is_valid():
                guide = serializer.save()
                return Response({
                    'success': True,
                    'message': 'Event guide updated successfully',
                    'data': EventGuideSerializer(guide, context={'request': request}).data
                }, status=status.HTTP_200_OK)
            
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return create_error_response(f'Failed to update event guide: {str(e)}', 500)

    def delete(self, request, event_id):
        """Delete event guide"""
        try:
            event = get_object_or_404(Event, id=event_id)
            
            try:
                guide = event.guide
                guide.delete()
                return Response({
                    'success': True,
                    'message': 'Event guide deleted successfully'
                }, status=status.HTTP_200_OK)
            except EventGuide.DoesNotExist:
                return create_error_response('Event guide not found', 404)
                
        except Exception as e:
            return create_error_response(f'Failed to delete event guide: {str(e)}', 500)

class AvailableUsersForBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]

class AvailableUsersForBookingAPIView(ListAPIView):
    """
    NIGGA GET THIS ENDPOINT - /api/events/<event_id>/available-users/
    """
    permission_classes = [IsAdminUser]
    serializer_class = AvailableUsersForBookingSerializer

    def get_queryset(self):
        event_id = self.kwargs["event_id"]
        event = get_object_or_404(Event, id=event_id)
        registered_user_ids = Participant.objects.filter(event=event).values_list("user_id", flat=True)
        return User.objects.exclude(id__in=registered_user_ids).order_by("username")


class EventFormResponsesAPIView(ListAPIView):
    """
    GET /api/events/<event_id>/form-responses/
    Returns all form responses (answers) for participants of an event (admin only)
    """
    permission_classes = [IsEventStaffOrAdmin]
    serializer_class = FormResponseSerializer

    def get_queryset(self):
        event_id = self.kwargs["event_id"]
        event = get_object_or_404(Event, id=event_id)
        return Participant.objects.filter(event=event).exclude(answers=None)

class ParticipantFormResponseAPIView(RetrieveAPIView):
    """
    GET /api/events/<event_id>/participants/<int:participant_id>/form-response/
    Returns a single participant's form response for an event (admin only)
    """
    permission_classes = [IsEventStaffOrAdmin]
    serializer_class = FormResponseSerializer

    def get_object(self):
        event_id = self.kwargs["event_id"]
        participant_id = self.kwargs["participant_id"]
        event = get_object_or_404(Event, id=event_id)
        participant = get_object_or_404(Participant, id=participant_id, event=event)
        return participant
# ===
# ========== EVENT CATEGORY ENDPOINTS ==========

class EventCategoryListAPIView(APIView):
    """
    Get all active event categories
    GET /api/events/categories/
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get all active event categories"""
        try:
            from .models import EventCategory
            categories = EventCategory.objects.filter(is_active=True).order_by('order')
            
            data = [{
                'code': cat.code,
                'display_name': cat.display_name,
                'description': cat.description
            } for cat in categories]
            
            return create_success_response(data=data)
            
        except Exception as e:
            return create_error_response(f'Failed to fetch event categories: {str(e)}', 500)


class EventCategoryCreateAPIView(APIView):
    """
    Create a new event category (Admin only)
    POST /api/events/categories/create/
    """
    permission_classes = [IsEventStaffOrAdmin]
    
    def post(self, request):
        """Create a new event category"""
        try:
            from .models import EventCategory
            
            code = request.data.get('code')
            display_name = request.data.get('display_name')
            description = request.data.get('description', '')
            order = request.data.get('order', 0)
            
            if not code or not display_name:
                return create_error_response('Code and display_name are required', 400)
            
            # Check if category with this code already exists
            if EventCategory.objects.filter(code=code).exists():
                return create_error_response('Category with this code already exists', 400)
            
            category = EventCategory.objects.create(
                code=code,
                display_name=display_name,
                description=description,
                order=order
            )
            
            data = {
                'id': category.id,
                'code': category.code,
                'display_name': category.display_name,
                'description': category.description,
                'order': category.order
            }
            
            return create_success_response(
                data=data,
                message='Event category created successfully'
            )
            
        except Exception as e:
            return create_error_response(f'Failed to create event category: {str(e)}', 500)


class EventCategoryUpdateAPIView(APIView):
    """
    Update an event category (Admin only)
    PUT/PATCH /api/events/categories/<category_id>/update/
    """
    permission_classes = [IsEventStaffOrAdmin]
    
    def put(self, request, category_id):
        """Update event category"""
        return self._update_category(request, category_id, partial=False)
    
    def patch(self, request, category_id):
        """Partially update event category"""
        return self._update_category(request, category_id, partial=True)
    
    def _update_category(self, request, category_id, partial=False):
        try:
            from .models import EventCategory
            
            category = get_object_or_404(EventCategory, id=category_id)
            
            if not partial:
                # Full update - require all fields
                code = request.data.get('code')
                display_name = request.data.get('display_name')
                
                if not code or not display_name:
                    return create_error_response('Code and display_name are required', 400)
                
                category.code = code
                category.display_name = display_name
            else:
                # Partial update - only update provided fields
                if 'code' in request.data:
                    category.code = request.data['code']
                if 'display_name' in request.data:
                    category.display_name = request.data['display_name']
            
            if 'description' in request.data:
                category.description = request.data['description']
            if 'order' in request.data:
                category.order = request.data['order']
            if 'is_active' in request.data:
                category.is_active = request.data['is_active']
            
            category.save()
            
            data = {
                'id': category.id,
                'code': category.code,
                'display_name': category.display_name,
                'description': category.description,
                'order': category.order,
                'is_active': category.is_active
            }
            
            return create_success_response(
                data=data,
                message='Event category updated successfully'
            )
            
        except Exception as e:
            return create_error_response(f'Failed to update event category: {str(e)}', 500)


class EventCategoryDeleteAPIView(APIView):
    """
    Delete an event category (Admin only)
    DELETE /api/events/categories/<category_id>/delete/
    """
    permission_classes = [IsEventStaffOrAdmin]
    
    def delete(self, request, category_id):
        """Delete event category"""
        try:
            from .models import EventCategory
            
            category = get_object_or_404(EventCategory, id=category_id)
            
            # Check if any events are using this category
            if category.event_set.exists():
                return create_error_response(
                    'Cannot delete category that is being used by events', 
                    400
                )
            
            category_name = category.display_name
            category.delete()
            
            return create_success_response(
                message=f'Event category "{category_name}" deleted successfully'
            )
            
        except Exception as e:
            return create_error_response(f'Failed to delete event category: {str(e)}', 500)