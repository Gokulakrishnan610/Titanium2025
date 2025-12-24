from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from django.utils import timezone

User = get_user_model()


class Club(models.Model):
    """Model for managing multiple clubs in the system"""
    
    CLUB_TYPE_CHOICES = [
        ('technical', 'Technical Club'),
        ('cultural', 'Cultural Club'),
        ('sports', 'Sports Club'),
        ('academic', 'Academic Club'),
        ('social', 'Social Club'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ]
    
    # Basic Information
    name = models.CharField(max_length=200, unique=True, help_text="Club name")
    slug = models.SlugField(max_length=200, unique=True, help_text="URL-friendly club identifier")
    description = models.TextField(help_text="Club description")
    club_type = models.CharField(max_length=20, choices=CLUB_TYPE_CHOICES, default='other')
    
    # Contact Information
    email = models.EmailField(help_text="Official club email")
    phone = models.CharField(
        max_length=15, 
        blank=True,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")]
    )
    website = models.URLField(blank=True, help_text="Club website URL")
    
    # Visual Identity
    logo = models.ImageField(upload_to='club_logos/', blank=True, null=True, help_text="Club logo")
    banner = models.ImageField(upload_to='club_banners/', blank=True, null=True, help_text="Club banner image")
    primary_color = models.CharField(max_length=7, default='#007bff', help_text="Primary brand color (hex code)")
    secondary_color = models.CharField(max_length=7, default='#6c757d', help_text="Secondary brand color (hex code)")
    
    # Management
    admin_users = models.ManyToManyField(
        User, 
        through='ClubMembership',
        related_name='administered_clubs',
        help_text="Users who can manage this club"
    )
    
    # Settings
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_default = models.BooleanField(default=False, help_text="Default club for the system")
    allow_public_events = models.BooleanField(default=True, help_text="Allow public to view club events")
    require_approval = models.BooleanField(default=False, help_text="Require admin approval for event creation")
    
    # Payment Gateway Configuration
    payment_gateway = models.CharField(
        max_length=20,
        choices=[('cashfree', 'Cashfree'), ('payu', 'PayU')],
        default='cashfree',
        help_text="Default payment gateway for this club"
    )
    gateway_credentials = models.JSONField(
        default=dict,
        blank=True,
        help_text="Payment gateway credentials (JSON format)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Club"
        verbose_name_plural = "Clubs"
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Ensure only one default club exists
        if self.is_default:
            Club.objects.filter(is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)
    
    @classmethod
    def get_default_club(cls):
        """Get the default club for the system"""
        try:
            return cls.objects.get(is_default=True, status='active')
        except cls.DoesNotExist:
            # Return the first active club if no default is set
            return cls.objects.filter(status='active').first()
    
    @property
    def is_active(self):
        return self.status == 'active'
    
    @property
    def total_events(self):
        return self.events.count()
    
    @property
    def active_events(self):
        return self.events.filter(is_active=True).count()
    
    @property
    def total_members(self):
        return self.memberships.filter(status='active').count()


class ClubMembership(models.Model):
    """Model for managing club memberships and roles"""
    
    ROLE_CHOICES = [
        ('admin', 'Club Admin'),
        ('moderator', 'Moderator'),
        ('event_manager', 'Event Manager'),
        ('member', 'Member'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending', 'Pending Approval'),
    ]
    
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='club_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Permissions
    can_create_events = models.BooleanField(default=False)
    can_manage_members = models.BooleanField(default=False)
    can_manage_payments = models.BooleanField(default=False)
    can_view_analytics = models.BooleanField(default=False)
    
    # Timestamps
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('club', 'user')
        ordering = ['-joined_at']
        verbose_name = "Club Membership"
        verbose_name_plural = "Club Memberships"
    
    def __str__(self):
        return f"{self.user.username} - {self.club.name} ({self.role})"
    
    def save(self, *args, **kwargs):
        # Auto-assign permissions based on role
        if self.role == 'admin':
            self.can_create_events = True
            self.can_manage_members = True
            self.can_manage_payments = True
            self.can_view_analytics = True
        elif self.role == 'moderator':
            self.can_create_events = True
            self.can_manage_members = True
            self.can_view_analytics = True
        elif self.role == 'event_manager':
            self.can_create_events = True
            self.can_view_analytics = True
        
        super().save(*args, **kwargs)


class ClubSettings(models.Model):
    """Model for storing club-specific settings and configurations"""
    
    club = models.OneToOneField(Club, on_delete=models.CASCADE, related_name='settings')
    
    # Email Settings
    email_signature = models.TextField(blank=True, help_text="Email signature for club communications")
    notification_emails = models.JSONField(
        default=list,
        blank=True,
        help_text="List of emails to receive notifications"
    )
    
    # Event Settings
    default_event_duration = models.PositiveIntegerField(default=120, help_text="Default event duration in minutes")
    auto_approve_events = models.BooleanField(default=True, help_text="Auto-approve events created by members")
    max_events_per_month = models.PositiveIntegerField(null=True, blank=True, help_text="Maximum events per month (optional)")
    
    # Registration Settings
    default_registration_deadline_days = models.PositiveIntegerField(
        default=1, 
        help_text="Default registration deadline (days before event)"
    )
    allow_late_registration = models.BooleanField(default=False, help_text="Allow registration after deadline")
    
    # Payment Settings
    default_currency = models.CharField(max_length=3, default='INR', help_text="Default currency code")
    payment_terms = models.TextField(blank=True, help_text="Payment terms and conditions")
    
    # Social Media
    social_links = models.JSONField(
        default=dict,
        blank=True,
        help_text="Social media links (JSON format)"
    )
    
    # Custom Fields
    custom_fields = models.JSONField(
        default=dict,
        blank=True,
        help_text="Custom club-specific fields"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Club Settings"
        verbose_name_plural = "Club Settings"
    
    def __str__(self):
        return f"Settings for {self.club.name}"