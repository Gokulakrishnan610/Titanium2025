from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
import hashlib
from datetime import datetime, time

User = get_user_model()


class EventCategory(models.Model):
    """Model to store event category choices dynamically"""
    code = models.CharField(max_length=20, unique=True, help_text="Category code (e.g., 'workshop', 'seminar')")
    display_name = models.CharField(max_length=50, help_text="Display name (e.g., 'Workshop', 'Seminar')")
    description = models.TextField(blank=True, help_text="Optional description of the category")
    is_active = models.BooleanField(default=True, help_text="Whether this category is currently active")
    order = models.IntegerField(default=0, help_text="Display order (lower numbers appear first)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Event Category"
        verbose_name_plural = "Event Categories"
        ordering = ['order', 'code']

    def __str__(self):
        return f"{self.display_name} ({self.code})"

    @classmethod
    def get_choices(cls):
        """Get active categories as choices for form fields"""
        return [(cat.code, cat.display_name) for cat in cls.objects.filter(is_active=True).order_by('order')]

    @classmethod
    def populate_defaults(cls):
        """Populate default category choices if none exist"""
        if not cls.objects.exists():
            default_categories = [
                ('workshop', 'Workshop', 'Hands-on learning sessions', 1),
                ('seminar', 'Seminar', 'Educational presentations and talks', 2),
                ('competition', 'Competition', 'Competitive events and contests', 3),
                ('hackathon', 'Hackathon', 'Coding competitions and innovation challenges', 4),
                ('meetup', 'Meetup', 'Networking and community gatherings', 5),
                ('conference', 'Conference', 'Large-scale professional events', 6),
                ('other', 'Other', 'Miscellaneous events', 7),
            ]
            for code, display_name, description, order in default_categories:
                cls.objects.create(
                    code=code, 
                    display_name=display_name, 
                    description=description,
                    order=order
                )

class Event(models.Model):
    # Remove hardcoded EVENT_TYPE_CHOICES - now using dynamic EventCategory
    
    PAYMENT_TYPE_CHOICES = [
        ('free', 'Free'),
        ('paid', 'Paid'),
    ]
    
    PARTICIPATION_TYPE_CHOICES = [
        ('intra', 'Intra College'),
        ('inter', 'Inter College'),
    ]
    
    GATEWAY_OPTIONS_CHOICES = [
        ('payu', 'PayU'),
        ('cashfree', 'Cashfree'),
    ]
    
    EVENT_MODE_CHOICES = [
        ('offline', 'Offline'),
        ('online', 'Online'),
    ]
    
    event_name = models.CharField(max_length=200, help_text="Name of the event")
    description = models.TextField(help_text="Detailed description of the event")
    event_date = models.DateTimeField(help_text="Date and time of the event")
    event_end_date = models.DateField(null=True, blank=True, help_text="End date of the event (for multi-day events)")
    start_time = models.TimeField(null=True, blank=True, help_text="Start time of the event")
    end_time = models.TimeField(null=True, blank=True, help_text="End time of the event")
    event_type = models.ForeignKey(
        EventCategory,
        on_delete=models.CASCADE,
        help_text="Type of event"
    )
    payment_type = models.CharField(
        max_length=10, 
        choices=PAYMENT_TYPE_CHOICES, 
        default='free',
        help_text="Whether the event is free or paid"
    )
    participation_type = models.CharField(
        max_length=10, 
        choices=PARTICIPATION_TYPE_CHOICES, 
        default='intra',
        help_text="Intra college or inter college event"
    )
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Price for paid events (leave blank for free events)"
    )
    max_participants = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Maximum number of participants (optional)"
    )
    registration_deadline = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Last date for registration (optional)"
    )
    venue = models.CharField(
        max_length=200, 
        null=True, 
        blank=True,
        help_text="Event venue"
    )
    event_mode = models.CharField(
        max_length=10,
        choices=EVENT_MODE_CHOICES,
        default='offline',
        help_text="Whether the event is online or offline"
    )
    meeting_url = models.URLField(
        null=True,
        blank=True,
        help_text="Meeting URL for online events (Google Meet, Zoom, etc.)"
    )
    event_image = models.ImageField(
        upload_to='event_images/',
        blank=True,
        null=True,
        help_text="Event image file"
    )
    event_video = models.URLField(blank=True, help_text="Event video URL")
    video_url = models.URLField(
        blank=True,
        null=True,
        help_text="Social media post URL (Instagram, Twitter, etc.)"
    )
    require_registration_form = models.BooleanField(
        default=False,
        help_text="Whether registration form with questions is required"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the event is currently active"
    )
    gateway_options = models.CharField(
        max_length=20,
        choices=GATEWAY_OPTIONS_CHOICES,
        null=True,
        blank=True,
        help_text="Payment gateway to use for this event"
    )
    gateway_credentials = models.JSONField(
        null=True,
        blank=True,
        help_text="Custom payment gateway credentials (JSON format)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-event_date']
        verbose_name = "Event"
        verbose_name_plural = "Events"
    
    def __str__(self):
        if hasattr(self.event_date, 'strftime'):
            return f"{self.event_name} - {self.event_date.strftime('%Y-%m-%d')}"
        else:
            return f"{self.event_name} - {self.event_date}"
    
    @property
    def is_upcoming(self):
        return self.event_date and self.event_date > timezone.now()

    @property
    def is_full(self):
        """Check if the event is full"""
        if self.max_participants and self.max_participants > 0:
            return self.participants.filter(registration_status='confirmed').count() >= self.max_participants
        return False

    @property
    def get_current_participants(self):
        return self.participants.filter(registration_status='confirmed').count()

    @property
    def is_registration_open(self):
        """Check if registration is still open"""
        if self.is_full:
            return False

        if self.registration_deadline:
            deadline = self.registration_deadline

            if timezone.is_naive(deadline):
                deadline = timezone.make_aware(deadline, timezone.get_current_timezone())

            deadline_local_date = deadline.astimezone(timezone.get_current_timezone()).date()
            deadline_datetime = datetime.combine(deadline_local_date, time(23, 59, 59))
            deadline_datetime = timezone.make_aware(deadline_datetime, timezone.get_current_timezone())

            # Final comparison
            return timezone.now() < deadline_datetime

        return self.is_upcoming

    
    def block_event_visibility(self, user) -> bool:
        """Blocks visibility to intra college events for non-REC users"""
        if not user or not user.email:
            return True

        email_parts = user.email.split('@')
        if len(email_parts) != 2:
            return True

        _, email_domain = email_parts
        if email_domain.lower() != 'rajalakshmi.edu.in' and self.participation_type == 'intra':
            return True
        return False

    def check_time_clash(self, user):
        """
        Check for time clashes with user's other registered events
        Returns: (clash_type, message)
        - 'block': Time clash detected, block registration
        - None: No clash
        """
        if not user or not self.event_date:
            return None, None

        if not hasattr(self, 'start_time') or not hasattr(self, 'end_time'):
            return None, None

        if not self.start_time or not self.end_time:
            return None, None

        event_date = self.event_date.date()

        from django.db.models import Q
        user_registrations = Participant.objects.filter(
            user=user,
            registration_status='confirmed'
        ).exclude(event=self).select_related('event').filter(
            Q(event__event_date__date=event_date) 
        )

        for registration in user_registrations:
            other_event = registration.event

            if not hasattr(other_event, 'start_time') or not hasattr(other_event, 'end_time'):
                continue
            if not other_event.start_time or not other_event.end_time:
                continue

            if (self.start_time < other_event.end_time and
                self.end_time > other_event.start_time):
                message = f'Time clash detected! You are already registered for "{other_event.event_name}" from {other_event.start_time.strftime("%H:%M")} to {other_event.end_time.strftime("%H:%M")} on {event_date.strftime("%Y-%m-%d")}.'
                return 'block', message

        return None, None


class EventQuestion(models.Model):
    """Dynamic questions for event registration"""
    
    QUESTION_TYPE_CHOICES = [
        ('short_text', 'Short Text'),
        ('long_text', 'Long Text'),
        ('email', 'Email'),
        ('phone', 'Phone Number'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('single_choice', 'Single Choice'),
        ('multi_choice', 'Multiple Choice'),
        ('file', 'File Upload'),  
    ]
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='questions')
    label = models.CharField(max_length=255, help_text="Question text")
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='short_text')
    required = models.BooleanField(default=True, help_text="Is this question mandatory?")
    order = models.PositiveIntegerField(default=0, help_text="Display order")
    help_text = models.CharField(max_length=255, blank=True, help_text="Helper text for the question")
    options = models.JSONField(blank=True, null=True, help_text="Options for choice questions (list of strings)")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', 'id']
        verbose_name = "Event Question"
        verbose_name_plural = "Event Questions"
    
    def __str__(self):
        return f"{self.event.event_name} - {self.label}"


class Participant(models.Model):
    """Event participant with registration details"""

    REGISTRATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='participants')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='participants')
    registration_status = models.CharField(max_length=20,choices=REGISTRATION_STATUS_CHOICES,default='confirmed')
    payment_status = models.BooleanField(default=False) 
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    answers = models.JSONField(default=list, blank=True, help_text="User's answers to event questions")

    class Meta:
        unique_together = ('user', 'event')  # Prevent duplicate registrations
        verbose_name = "Event Participant"
        verbose_name_plural = "Event Participants"
        ordering = ['-registered_at']
        indexes = [
            models.Index(fields=['event', 'registration_status']),
            models.Index(fields=['user', 'registered_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.event.event_name}"

    @property
    def participant_name(self):
        """Get participant's full name"""
        return self.user.get_full_name() or self.user.username
    
    @property
    def participant_email(self):
        """Get participant's email"""
        return self.user.email
    
    @property
    def participant_rollno(self):
        """Get participant's roll number from profile"""
        try:
            if hasattr(self.user, 'profile') and self.user.profile:
                return self.user.profile.rollno or "N/A"
        except:
            pass
        return "Unknown"
    
    @property
    def participant_department(self):
        """Get participant's department from profile"""
        try:
            if hasattr(self.user, 'profile') and self.user.profile:
                return self.user.profile.get_department_display() or "N/A"
        except:
            pass
        return "N/A"
    
    @property
    def participant_year(self):
        """Get participant's year from profile"""
        try:
            if hasattr(self.user, 'profile') and self.user.profile:
                return self.user.profile.year or "N/A"
        except:
            pass
        return "N/A"
    
    @property
    def is_payment_required(self):
        """Check if payment is required for this event"""
        return self.event.payment_type == 'paid'
    
    @property
    def can_attend(self):
        """Check if participant can attend (registration confirmed and payment done if required)"""
        if self.registration_status != 'confirmed':
            return False
        if self.is_payment_required and not self.payment_status:
            return False
        return True
    

class ODList(models.Model):
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='registered_participants')
    event = models.ForeignKey(Event , on_delete=models.CASCADE, related_name='od_lists')
    qr_sent = models.BooleanField(default=False)
    attendance = models.BooleanField(default=False)
    hash = models.CharField(max_length=64, unique=True)
    attendance_marked_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('participant',)
        verbose_name = "On Duty List Entry"
        verbose_name_plural = "On Duty List"
    
    def __str__(self):
        return f"{self.participant.user.username} - {self.participant.event.event_name}"
    
    def save(self, *args, **kwargs):
        if not self.hash:
            hash_string = f"{self.participant.user.id}{self.participant.event.id}{timezone.now().timestamp()}"
            self.hash = hashlib.sha256(hash_string.encode()).hexdigest()
        super().save(*args, **kwargs)
    
    @property
    def is_qr_sent(self):
        return self.qr_sent
    
    @property
    def is_attended(self):
        return self.attendance


class EventGuide(models.Model):
    """Event guide with additional details and specifications"""
    
    LANGUAGE_CHOICES = [
        ('english', 'English'),
        ('hindi', 'Hindi'),
        ('tamil', 'Tamil'),
        ('english_hindi', 'English, Hindi'),
        ('english_tamil', 'English, Tamil'),
        ('all', 'All Languages'),
    ]
    
    LAYOUT_CHOICES = [
        ('indoor', 'Indoor'),
        ('outdoor', 'Outdoor'),
        ('hybrid', 'Hybrid'),
    ]
    
    SEATING_CHOICES = [
        ('standing', 'Standing'),
        ('seated', 'Seated'),
        ('mixed', 'Mixed'),
    ]
    
    ENTRY_AGE_CHOICES = [
        ('all_ages', 'All ages'),
        ('13_above', '13 yrs & above'),
        ('18_above', '18 yrs & above'),
        ('21_above', '21 yrs & above'),
    ]
    
    event = models.OneToOneField(Event, on_delete=models.CASCADE, related_name='guide')
    language = models.CharField(
        max_length=20, 
        choices=LANGUAGE_CHOICES, 
        default='english',
        help_text="Language(s) of the event"
    )
    duration = models.CharField(
        max_length=50, 
        help_text="Duration of the event (e.g., '3 Days', '2 Hours')"
    )
    tickets_needed_for = models.CharField(
        max_length=50,
        help_text="Age requirement for tickets (e.g., '13 yrs & above')"
    )
    entry_allowed_for = models.CharField(
        max_length=20, 
        choices=ENTRY_AGE_CHOICES, 
        default='all_ages',
        help_text="Age restriction for entry"
    )
    layout = models.CharField(
        max_length=10, 
        choices=LAYOUT_CHOICES, 
        default='indoor',
        help_text="Event layout/location type"
    )
    seating_arrangement = models.CharField(
        max_length=10, 
        choices=SEATING_CHOICES, 
        default='seated',
        help_text="Seating arrangement"
    )
    venue = models.CharField(
        max_length=200,
        default="TBD",
        help_text="Event venue location"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Event Guide"
        verbose_name_plural = "Event Guides"
    
    def __str__(self):
        return f"Guide for {self.event.event_name}"
