from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class OAuthToken(models.Model):
    PROVIDER_CHOICES = (
        ('google', 'Google'),
        ('github', 'GitHub'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='oauth_tokens')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    access_token = models.TextField()
    refresh_token = models.TextField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'provider')
        
    @property
    def is_expired(self):
        if not self.expires_at:
            return True
        return self.expires_at <= timezone.now()


class UserProfile(models.Model):
    """User profile model for DEVS REC user management"""
    
    # Import choices from users app
    from users.choices import GENDER_CHOICES, DEGREE_CHOICES, DEPARTMENT_CHOICES, YEAR_CHOICES
    from users.dynamic_choices_models import Year, Department
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=255, blank=True, help_text="Optional display name")
    gender = models.CharField(max_length=1, blank=True)
    degree = models.CharField(max_length=50, blank=True)
    year = models.CharField(max_length=20, blank=True, help_text="Academic year")
    department = models.CharField(max_length=255, blank=True, help_text="Department code")
    rollno = models.CharField(max_length=20, blank=True, help_text="Student roll number")
    phone_number = models.CharField(max_length=15, blank=True)
    college_name = models.CharField(max_length=255, default="Rajalakshmi Engineering College")
    profile_picture = models.URLField(blank=True, help_text="Social profile picture URL")
    date_of_birth = models.DateField(null=True, blank=True)
    bio = models.TextField(blank=True, max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_eventStaff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_qr_scanner = models.BooleanField(default=False, help_text="Can access QR scanner functionality")
    is_verified = models.BooleanField(default=False)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        db_table = 'users_userprofile'  # Use existing table from users app

    def __str__(self):
        return f"{self.user.username}'s profile"
    
    def get_year_from_rollno(self):
        """
        Automatically determine graduation year based on roll number pattern and degree:
        
        For Undergraduate (B.E/B.Tech):
        25 -> 2029 (1st Year, 4 years to graduation)
        24 -> 2028 (2nd Year, 3 years to graduation)
        23 -> 2027 (3rd Year, 2 years to graduation)
        22 -> 2026 (4th Year, 1 year to graduation)
        
        For Postgraduate (M.E/M.Tech/MBA):
        25 -> 2027 (PG 1st Year, 2 years to graduation)
        24 -> 2026 (PG 2nd Year, 1 year to graduation)
        """
        if not self.rollno:
            return None
        
        # Extract first 2 digits from roll number
        try:
            year_prefix = self.rollno[:2]
            if year_prefix.isdigit():
                year_code = int(year_prefix)
                
                # Check if this is a postgraduate student
                is_postgraduate = self.degree in ['M.E', 'M.Tech', 'MBA']
                
                if is_postgraduate:
                    # Postgraduate graduation mapping (2 years program)
                    pg_graduation_mapping = {
                        25: '2027',  # 2025 batch graduates in 2027
                        24: '2026',  # 2024 batch graduates in 2026
                        23: '2025',  # 2023 batch graduates in 2025
                        22: '2024',  # 2022 batch graduates in 2024
                    }
                    return pg_graduation_mapping.get(year_code)
                else:
                    # Undergraduate graduation mapping (4 years program)
                    ug_graduation_mapping = {
                        25: '2029',  # 2025 batch graduates in 2029
                        24: '2028',  # 2024 batch graduates in 2028
                        23: '2027',  # 2023 batch graduates in 2027
                        22: '2026',  # 2022 batch graduates in 2026
                    }
                    return ug_graduation_mapping.get(year_code)
        except (ValueError, IndexError):
            pass
        
        return None
    
    def auto_set_year_from_rollno(self):
        """
        Automatically set year field based on roll number if year is not already set
        """
        if not self.year and self.rollno:
            detected_year = self.get_year_from_rollno()
            if detected_year:
                self.year = detected_year
                return True
        return False
    
    def save(self, *args, **kwargs):
        """Override save to automatically set year from roll number"""
        # Auto-set year from roll number if not already set
        self.auto_set_year_from_rollno()
        super().save(*args, **kwargs)

    def get_year_display(self):
        """Get the display name for the year (method for Django admin compatibility)"""
        from users.dynamic_choices_models import Year
        from users.choices import YEAR_CHOICES
        
        if self.year:
            try:
                year_obj = Year.objects.get(code=self.year, is_active=True)
                return year_obj.display_name
            except Year.DoesNotExist:
                # Fallback to hardcoded choices if dynamic model doesn't exist
                year_choices = dict(YEAR_CHOICES)
                return year_choices.get(self.year, self.year)
        return None
    
    @property
    def year_display(self):
        """Get the display name for the year (property for template/serializer compatibility)"""
        return self.get_year_display()

    @property
    def department_display(self):
        """Get the display name for the department"""
        from users.dynamic_choices_models import Department
        from users.choices import DEPARTMENT_CHOICES
        
        if self.department:
            try:
                dept_obj = Department.objects.get(code=self.department, is_active=True)
                return dept_obj.full_name
            except Department.DoesNotExist:
                # Fallback to hardcoded choices if dynamic model doesn't exist
                dept_choices = dict(DEPARTMENT_CHOICES)
                return dept_choices.get(self.department, self.department)
        return None

    @property
    def is_profile_complete(self):
        required_fields = [self.gender, self.degree, self.year, self.department, self.rollno, self.phone_number, self.is_verified]
        return all(required_fields)