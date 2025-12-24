"""
Dynamic choices models for Year and Department
These models allow admins to manage year and department options from the admin panel
"""
from django.db import models


class Year(models.Model):
    """Model to store academic year choices dynamically"""
    code = models.CharField(max_length=10, unique=True, help_text="Year code (e.g., '1', '2', 'PG1')")
    display_name = models.CharField(max_length=50, help_text="Display name (e.g., '1st Year', '2nd Year')")
    is_active = models.BooleanField(default=True, help_text="Whether this year option is currently active")
    order = models.IntegerField(default=0, help_text="Display order (lower numbers appear first)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Academic Year"
        verbose_name_plural = "Academic Years"
        ordering = ['order', 'code']
        app_label = 'academic'

    def __str__(self):
        return f"{self.display_name} ({self.code})"

    @classmethod
    def get_choices(cls):
        """Get active years as choices for form fields"""
        return [(year.code, year.display_name) for year in cls.objects.filter(is_active=True).order_by('order')]

    @classmethod
    def populate_defaults(cls):
        """Populate default year choices if none exist"""
        if not cls.objects.exists():
            default_years = [
                ('1', 'Year I (2025)', 1),
                ('2', 'Year II (2024)', 2),
                ('3', 'Year III (2023)', 3),
                ('4', 'Year IV (2022)', 4),
                ('PG1', 'PG Year I', 5),
                ('PG2', 'PG Year II', 6),
                ('PhD', 'Ph.D.', 7),
            ]
            for code, display_name, order in default_years:
                cls.objects.create(code=code, display_name=display_name, order=order)


class Department(models.Model):
    """Model to store department choices dynamically"""
    code = models.CharField(max_length=50, unique=True, help_text="Department code (e.g., 'CSE', 'ECE')")
    full_name = models.CharField(max_length=255, help_text="Full department name")
    category = models.CharField(
        max_length=50,
        choices=[
            ('UG', 'Undergraduate'),
            ('PG', 'Postgraduate'),
            ('PhD', 'Doctoral'),
        ],
        default='UG',
        help_text="Department category"
    )
    is_active = models.BooleanField(default=True, help_text="Whether this department is currently active")
    order = models.IntegerField(default=0, help_text="Display order (lower numbers appear first)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Department"
        verbose_name_plural = "Departments"
        ordering = ['category', 'order', 'code']
        app_label = 'academic'

    def __str__(self):
        return f"{self.full_name} ({self.code})"

    @classmethod
    def get_choices(cls):
        """Get active departments as choices for form fields"""
        return [(dept.code, dept.full_name) for dept in cls.objects.filter(is_active=True).order_by('category', 'order')]

    @classmethod
    def get_choices_by_category(cls, category):
        """Get active departments filtered by category"""
        return [(dept.code, dept.full_name) for dept in cls.objects.filter(is_active=True, category=category).order_by('order')]

    @classmethod
    def populate_defaults(cls):
        """Populate default department choices if none exist"""
        if not cls.objects.exists():
            default_departments = [
                # Undergraduate Departments
                ('Aero', 'Aeronautical Engineering', 'UG', 1),
                ('Auto', 'Automobile Engineering', 'UG', 2),
                ('BME', 'Biomedical Engineering', 'UG', 3),
                ('Biotech', 'Biotechnology', 'UG', 4),
                ('Chem', 'Chemical Engineering', 'UG', 5),
                ('Civil', 'Civil Engineering', 'UG', 6),
                ('CSE', 'Computer Science & Engineering', 'UG', 7),
                ('CSE_CS', 'Computer Science & Engineering (Cyber Security)', 'UG', 8),
                ('CSBS', 'Computer Science & Business Systems', 'UG', 9),
                ('CSD', 'Computer Science & Design', 'UG', 10),
                ('EEE', 'Electrical & Electronics Engineering', 'UG', 11),
                ('ECE', 'Electronics & Communication Engineering', 'UG', 12),
                ('FT', 'Food Technology', 'UG', 13),
                ('IT', 'Information Technology', 'UG', 14),
                ('AIML', 'Artificial Intelligence & Machine Learning', 'UG', 15),
                ('AIDS', 'Artificial Intelligence & Data Science', 'UG', 16),
                ('Mech', 'Mechanical Engineering', 'UG', 17),
                ('MCT', 'Mechatronics Engineering', 'UG', 18),
                ('Robotics', 'Robotics & Automation', 'UG', 19),
                ('HS', 'Humanities & Sciences', 'UG', 20),
                ('MS', 'Management Studies', 'UG', 21),
            ]
            for code, full_name, category, order in default_departments:
                cls.objects.create(code=code, full_name=full_name, category=category, order=order)
