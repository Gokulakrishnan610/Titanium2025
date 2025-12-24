from rest_framework import serializers
from .models import Event, ODList, Participant, EventGuide, EventQuestion
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

class EventQuestionSerializer(serializers.ModelSerializer):
    """Serializer for EventQuestion model"""

    question_type_display = serializers.CharField(source='get_question_type_display', read_only=True)

    class Meta:
        model = EventQuestion
        fields = [
            'id', 'event', 'label', 'question_type', 'question_type_display',
            'required', 'order', 'help_text', 'options', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_options(self, value):
        """Validate options for choice questions"""
        question_type = self.initial_data.get('question_type', self.instance.question_type if self.instance else None)

        if question_type in ['single_choice', 'multi_choice']:
            if not value or not isinstance(value, list) or len(value) == 0:
                raise serializers.ValidationError("Options are required for choice questions and must be a non-empty list.")
            if not all(isinstance(opt, str) for opt in value):
                raise serializers.ValidationError("All options must be strings.")

        return value
    
    def validate(self, data):
        if data.get('question_type') == 'file':
            allowed_extensions = data.get('help_text', '').split(',')  # Use help_text to store allowed file extensions
            if not allowed_extensions:
                raise serializers.ValidationError("File type questions must specify allowed extensions in help_text")
        return data

class EventSerializer(serializers.ModelSerializer):
    """Serializer for Event model"""

    is_upcoming = serializers.ReadOnlyField()
    is_registration_open = serializers.ReadOnlyField()
    get_current_participants = serializers.ReadOnlyField()
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)
    participation_type_display = serializers.CharField(source='get_participation_type_display', read_only=True)
    event_mode_display = serializers.CharField(source='get_event_mode_display', read_only=True)
    event_image_url = serializers.SerializerMethodField()
    questions = EventQuestionSerializer(many=True, read_only=True)

    def get_event_image_url(self, obj):
        """Return the full URL of the event image"""
        if obj.event_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.event_image.url)
            return obj.event_image.url
        return None

    class Meta:
        model = Event
        fields = [
            'id', 'event_name', 'description', 'event_date', 'event_end_date', 'start_time', 'end_time', 'event_type', 'event_type_display',
            'payment_type', 'payment_type_display', 'participation_type', 'participation_type_display', 'event_mode', 'event_mode_display', 'meeting_url',
            'price', 'max_participants', 'registration_deadline', 'venue', 'event_image', 'event_image_url', 'event_video', 'video_url',
            'require_registration_form', 'questions', 'is_active', 'is_upcoming', 'is_registration_open', 'get_current_participants', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_upcoming', 'is_registration_open', 'get_current_participants', 'event_image_url', 'questions']# 'gateway_options_display']
        
    def validate_event_date(self, value):
        """Validate that event date is in the future"""
        from django.utils import timezone
        now = timezone.now()

        if hasattr(value, 'date'):
            # value is a datetime object, compare with now
            if value <= now:
                raise serializers.ValidationError("Event date and time must be in the future.")
        else:
            # value is a date object, compare with today's date
            today = now.date()
            if value <= today:
                raise serializers.ValidationError("Event date must be in the future.")
        return value
        
    def validate_registration_deadline(self, value):
        """Validate that registration deadline is at least 1 hour before event start time"""
        if value and self.initial_data.get('event_date'):
            from django.utils.dateparse import parse_date, parse_time
            
            event_date_input = self.initial_data['event_date']
            event_date = parse_date(event_date_input) if isinstance(event_date_input, str) else event_date_input
            
            start_time_input = self.initial_data.get('start_time')
            if start_time_input:
                start_time = parse_time(start_time_input) if isinstance(start_time_input, str) else start_time_input
                if event_date and start_time:
                    # Combine date and time for event start
                    event_start_naive = datetime.combine(event_date, start_time)
                    event_start = timezone.make_aware(event_start_naive, timezone.get_current_timezone())
                    # Subtract 1 hour
                    event_start_minus_one_hour = event_start - timedelta(hours=1)
                    
                    if value >= event_start_minus_one_hour:
                        raise serializers.ValidationError("Registration deadline must be at least 1 hour before the event start time.")
                else:
                    # Fallback to date-only check if time not available
                    if hasattr(event_date, 'date'): 
                        event_date = event_date.date()
                    if hasattr(value, 'date'): 
                        deadline_date = value.date()
                    else:
                        deadline_date = value
                    
                    if event_date and deadline_date >= event_date:
                        raise serializers.ValidationError("Registration deadline must be before the event date.")
            else:
                # No start time, use date-only check
                if hasattr(event_date, 'date'): 
                    event_date = event_date.date()
                if hasattr(value, 'date'): 
                    deadline_date = value.date()
                else:
                    deadline_date = value
                
                if event_date and deadline_date >= event_date:
                    raise serializers.ValidationError("Registration deadline must be before the event date.")
        return value
        
    def validate_price(self, value):
        """Validate price based on payment type"""
        payment_type = self.initial_data.get('payment_type', self.instance.payment_type if self.instance else 'free')
        if payment_type == 'paid' and (not value or value <= 0):
            raise serializers.ValidationError("Price must be greater than 0 for paid events.")
        elif payment_type == 'free' and value:
            raise serializers.ValidationError("Price should not be set for free events.")
        return value

    # def validate_gateway_options(self, value):
    #     """Validate gateway options based on payment type"""
    #     payment_type = self.initial_data.get('payment_type', self.instance.payment_type if self.instance else 'free')
    #     if payment_type == 'paid' and value is None:
    #         raise serializers.ValidationError("Payment gateway must be selected for paid events.")
    #     elif payment_type == 'free' and value:
    #         raise serializers.ValidationError("Payment gateway should not be set for free events.")
    #     return value

    # def validate_gateway_credentials(self, value):
    #     """Validate gateway credentials format"""
    #     if value is not None:
    #         if not isinstance(value, dict):
    #             raise serializers.ValidationError("Gateway credentials must be a valid JSON object.")
    #         # Basic validation for common credential fields
    #         if not value:
    #             raise serializers.ValidationError("Gateway credentials cannot be empty when provided.")
    #     return value

    def validate(self, data):
        """Validate event data"""
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        event_date = data.get('event_date')
        event_end_date = data.get('event_end_date')

        if start_time and end_time:
            start_date = event_date.date() if hasattr(event_date, 'date') else event_date
            end_date = event_end_date if event_end_date else start_date

            # For same-day events, end time must be after start time
            if start_date == end_date:
                if start_time >= end_time:
                    raise serializers.ValidationError({
                        'end_time': 'End time must be after start time for same-day events.'
                    })

            # For multi-day events, no time validation needed as they span different days
            # The business rule allows end time to be before start time for multi-day events

        if event_end_date and event_date:
            start_date = event_date.date() if hasattr(event_date, 'date') else event_date
            if event_end_date < start_date:
                raise serializers.ValidationError({
                    'event_end_date': 'Event end date cannot be before start date.'
                })

        return data

class EventListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for event listings"""

    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)
    is_upcoming = serializers.ReadOnlyField()
    event_image_url = serializers.SerializerMethodField()
    require_registration_form = serializers.BooleanField(read_only=True)
    questions = EventQuestionSerializer(many=True, read_only=True)

    def get_event_image_url(self, obj):
        """Return the full URL of the event image"""
        if obj.event_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.event_image.url)
            return obj.event_image.url
        return None

    class Meta:
        model = Event
        fields = [
            'id', 'event_name', 'description', 'event_date', 'event_type', 'event_type_display',
            'payment_type', 'payment_type_display', 'venue', 'event_image', 'event_image_url', 'event_video', 'video_url',
            'require_registration_form', 'questions', 'is_active', 'is_upcoming'
        ]

class ODListSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    event_name = serializers.SerializerMethodField()
    registration_status = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    hash = serializers.SerializerMethodField()
    
    def get_user_name(self, obj):
        return f"{obj.participant.user.firstname} {obj.participant.user.lastname}"
    
    def get_user_email(self, obj):
        return obj.participant.user.email
    
    def get_event_name(self, obj):
        return obj.participant.event.event_name
    
    def get_registration_status(self, obj):
        return obj.participant.registration_status
    
    def get_payment_status(self, obj):
        return obj.participant.payment_status
    
    class Meta:
        model = ODList
        fields = [
            'id', 'participant', 'hash', 'attendance', 'attendance_marked_at',
            'user_name', 'user_email', 'event_name', 'registration_status', 'payment_status'
        ]
    
class ParticipantSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    event = EventSerializer(read_only=True)  # Include full event data
    attendance = serializers.SerializerMethodField()
    hash = serializers.SerializerMethodField()

    def get_user(self, obj):
        """Return full user details"""
        user = obj.user
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'display_name': user.get_full_name() or user.username,
        }

    def get_attendance(self, obj):
        """Return attendance status from ODList"""
        try:
            od_entry = obj.registered_participants.first()
            return od_entry.attendance if od_entry else False
        except:
            return False

    def get_hash(self, obj):
        """Return the QR hash from ODList"""
        try:
            od_entry = obj.registered_participants.first()
            return od_entry.hash if od_entry else None
        except:
            return None

    class Meta:
        model = Participant
        fields = '__all__'

class ParticipantListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = ['id', 'user', 'event', 'registration_status', 'payment_status']


class EventGuideSerializer(serializers.ModelSerializer):
    """Serializer for EventGuide model"""
    
    language_display = serializers.CharField(source='get_language_display', read_only=True)
    layout_display = serializers.CharField(source='get_layout_display', read_only=True)
    seating_arrangement_display = serializers.CharField(source='get_seating_arrangement_display', read_only=True)
    entry_allowed_for_display = serializers.CharField(source='get_entry_allowed_for_display', read_only=True)
    
    class Meta:
        model = EventGuide
        fields = [
            'id', 'event', 'language', 'language_display', 'duration', 
            'tickets_needed_for', 'entry_allowed_for', 'entry_allowed_for_display',
            'layout', 'layout_display', 'seating_arrangement', 'seating_arrangement_display',
            'venue', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EventQuestionSerializer(serializers.ModelSerializer):
    """Serializer for EventQuestion model"""

    question_type_display = serializers.CharField(source='get_question_type_display', read_only=True)

    class Meta:
        model = EventQuestion
        fields = [
            'id', 'event', 'label', 'question_type', 'question_type_display',
            'required', 'order', 'help_text', 'options', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_options(self, value):
        """Validate options for choice questions"""
        question_type = self.initial_data.get('question_type', self.instance.question_type if self.instance else None)

        if question_type in ['single_choice', 'multi_choice']:
            if not value or not isinstance(value, list) or len(value) == 0:
                raise serializers.ValidationError("Options are required for choice questions and must be a non-empty list.")
            if not all(isinstance(opt, str) for opt in value):
                raise serializers.ValidationError("All options must be strings.")

        return value

    def validate(self, data):
        if data.get('question_type') == 'file':
            allowed_extensions = data.get('help_text', '').split(',')  # Use help_text to store allowed file extensions
            if not allowed_extensions:
                raise serializers.ValidationError("File type questions must specify allowed extensions in help_text")
        return data


class BulkEventQuestionSerializer(serializers.Serializer):
    """Serializer for bulk creating/updating event questions"""

    questions = EventQuestionSerializer(many=True)

    def validate_questions(self, value):
        """Validate questions list"""
        if not value or len(value) == 0:
            raise serializers.ValidationError("At least one question is required.")
        return value

class FormResponseSerializer(serializers.ModelSerializer):
    """Serializer for form responses (participant answers)"""
    user_details = serializers.SerializerMethodField()
    submitted_at = serializers.DateTimeField(source='registered_at', read_only=True)

    def get_user_details(self, obj):
        """Return user details for the response"""
        user = obj.user
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'display_name': user.get_full_name() or user.username,
        }

    class Meta:
        model = Participant
        fields = ['id', 'user_details', 'answers', 'submitted_at']