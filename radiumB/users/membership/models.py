from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class DevsMembership(models.Model):
    """DEVS membership for first-year students"""
    
    MEMBERSHIP_TYPE_CHOICES = [
        ('basic', 'Basic DEVS Membership'),
        ('premium', 'Premium DEVS Membership'),
    ]
    
    MEMBERSHIP_STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('suspended', 'Suspended'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='devs_membership')
    membership_type = models.CharField(max_length=10, choices=MEMBERSHIP_TYPE_CHOICES, default='basic')
    status = models.CharField(max_length=10, choices=MEMBERSHIP_STATUS_CHOICES, default='active')
    claimed_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    premium_upgraded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "DEVS Membership"
        verbose_name_plural = "DEVS Memberships"
        ordering = ['-claimed_at']
        db_table = 'users_devsmembership'  # Use existing table from users app
    
    def __str__(self):
        return f"{self.user.username} - {self.get_membership_type_display()}"
    
    @property
    def is_active(self):
        """Check if membership is currently active"""
        if self.status != 'active':
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True
    
    @property
    def is_premium(self):
        """Check if user has premium membership"""
        return self.membership_type == 'premium' and self.is_active
    
    @classmethod
    def can_claim_membership(cls, user):
        """Check if user is eligible to claim DEVS membership"""
        # Must be first year student
        if not hasattr(user, 'profile') or not user.profile:
            return False, "User profile not found"
        
        if user.profile.year != '2029':
            return False, "Only first-year students (graduating 2029) can claim DEVS membership"
        
        # Check if already has membership
        if cls.objects.filter(user=user).exists():
            return False, "User already has DEVS membership"
        
        return True, "Eligible for DEVS membership"
    
    def upgrade_to_premium(self):
        """Upgrade basic membership to premium"""
        if self.membership_type == 'premium':
            return False, "Already premium member"
        
        if not self.is_active:
            return False, "Membership is not active"
        
        self.membership_type = 'premium'
        self.premium_upgraded_at = timezone.now()
        self.save()
        return True, "Successfully upgraded to premium membership"


class PremiumMembershipSlot(models.Model):
    """Premium membership slot management"""
    
    name = models.CharField(max_length=100, help_text="Slot batch name (e.g., 'Batch 1 - November 2025')")
    description = models.TextField(blank=True, help_text="Description of this premium slot batch")
    total_slots = models.PositiveIntegerField(help_text="Total number of premium slots available")
    is_open = models.BooleanField(default=False, help_text="Whether this slot is currently open for applications")
    opens_at = models.DateTimeField(null=True, blank=True, help_text="When this slot opens")
    closes_at = models.DateTimeField(null=True, blank=True, help_text="When this slot closes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Premium Membership Slot"
        verbose_name_plural = "Premium Membership Slots"
        ordering = ['-created_at']
        db_table = 'users_premiummembershipslot'  # Use existing table from users app
    
    def __str__(self):
        return f"{self.name} ({self.allocated_slots}/{self.total_slots})"
    
    @property
    def allocated_slots(self):
        """Number of slots already allocated"""
        return self.applications.filter(status='approved').count()
    
    @property
    def available_slots(self):
        """Number of slots still available"""
        return max(0, self.total_slots - self.allocated_slots)
    
    @property
    def is_full(self):
        """Check if all slots are allocated"""
        return self.available_slots == 0
    
    @property
    def is_currently_open(self):
        """Check if slot is currently open for applications"""
        if not self.is_open:
            return False
        
        now = timezone.now()
        
        if self.opens_at and now < self.opens_at:
            return False
        
        if self.closes_at and now > self.closes_at:
            return False
        
        return not self.is_full


class PremiumMembershipApplication(models.Model):
    """Applications for premium membership slots"""
    
    APPLICATION_STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('waitlist', 'Waitlisted'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='premium_applications')
    slot = models.ForeignKey(PremiumMembershipSlot, on_delete=models.CASCADE, related_name='applications')
    status = models.CharField(max_length=10, choices=APPLICATION_STATUS_CHOICES, default='pending')
    application_reason = models.TextField(help_text="Why do you want premium membership?")
    applied_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='reviewed_premium_applications'
    )
    review_notes = models.TextField(blank=True, help_text="Admin notes about the application")
    
    class Meta:
        verbose_name = "Premium Membership Application"
        verbose_name_plural = "Premium Membership Applications"
        ordering = ['-applied_at']
        unique_together = ('user', 'slot')  # One application per user per slot
        db_table = 'users_premiummembershipapplication'  # Use existing table from users app
    
    def __str__(self):
        return f"{self.user.username} - {self.slot.name} ({self.status})"
    
    def approve(self, reviewed_by=None, notes=""):
        """Approve the application and upgrade user to premium"""
        if self.status == 'approved':
            return False, "Application already approved"
        
        if self.slot.is_full:
            return False, "No slots available"
        
        # Update application
        self.status = 'approved'
        self.reviewed_at = timezone.now()
        self.reviewed_by = reviewed_by
        self.review_notes = notes
        self.save()
        
        # Upgrade user's membership to premium
        membership, created = DevsMembership.objects.get_or_create(
            user=self.user,
            defaults={'membership_type': 'premium'}
        )
        
        if not created and membership.membership_type != 'premium':
            membership.upgrade_to_premium()
        
        return True, "Application approved and membership upgraded"
    
    def reject(self, reviewed_by=None, notes=""):
        """Reject the application"""
        self.status = 'rejected'
        self.reviewed_at = timezone.now()
        self.reviewed_by = reviewed_by
        self.review_notes = notes
        self.save()
        return True, "Application rejected"
