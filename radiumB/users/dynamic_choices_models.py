"""
Dynamic choices models for Year, Category, and Department
These models allow admins to manage year, category, and department options from the admin panel
"""
from django.db import models


class Category(models.Model):
    """Model to store department category choices dynamically"""
    code = models.CharField(max_length=10, unique=True, help_text="Category code (e.g., 'UG', 'PG', 'PhD')")
    display_name = models.CharField(max_length=50, help_text="Display name (e.g., 'Undergraduate', 'Postgraduate')")
    is_active = models.BooleanField(default=True, help_text="Whether this category is currently active")
    order = models.IntegerField(default=0, help_text="Display order (lower numbers appear first)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ['order', 'code']
        app_label = 'academic'

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
                ('UG', 'Undergraduate', 1),
                ('PG', 'Postgraduate', 2),
                ('PhD', 'Doctoral', 3),
            ]
            for code, display_name, order in default_categories:
                cls.objects.create(code=code, display_name=display_name, order=order)


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
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        help_text="Department category"
    )
    is_active = models.BooleanField(default=True, help_text="Whether this department is currently active")
    order = models.IntegerField(default=0, help_text="Display order (lower numbers appear first)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Department"
        verbose_name_plural = "Departments"
        ordering = ['category__order', 'order', 'code']
        app_label = 'academic'

    def __str__(self):
        return f"{self.full_name} ({self.code})"

    @classmethod
    def get_choices(cls):
        """Get active departments as choices for form fields"""
        return [(dept.code, dept.full_name) for dept in cls.objects.filter(is_active=True).order_by('category__order', 'order')]

    @classmethod
    def get_choices_by_category(cls, category_code):
        """Get active departments filtered by category code"""
        return [(dept.code, dept.full_name) for dept in cls.objects.filter(
            is_active=True, 
            category__code=category_code,
            category__is_active=True
        ).order_by('order')]

    @classmethod
    def populate_defaults(cls):
        """Populate default department choices if none exist"""
        if not cls.objects.exists():
            # Ensure categories exist first
            Category.populate_defaults()
            
            # Get category instances
            ug_category = Category.objects.get(code='UG')
            pg_category = Category.objects.get(code='PG')
            phd_category = Category.objects.get(code='PhD')
            
            default_departments = [
                # Undergraduate Departments
                ('Aero', 'Aeronautical Engineering', ug_category, 1),
                ('Auto', 'Automobile Engineering', ug_category, 2),
                ('BME', 'Biomedical Engineering', ug_category, 3),
                ('Biotech', 'Biotechnology', ug_category, 4),
                ('Chem', 'Chemical Engineering', ug_category, 5),
                ('Civil', 'Civil Engineering', ug_category, 6),
                ('CSE', 'Computer Science & Engineering', ug_category, 7),
                ('CSE_CS', 'Computer Science & Engineering (Cyber Security)', ug_category, 8),
                ('CSBS', 'Computer Science & Business Systems', ug_category, 9),
                ('CSD', 'Computer Science & Design', ug_category, 10),
                ('EEE', 'Electrical & Electronics Engineering', ug_category, 11),
                ('ECE', 'Electronics & Communication Engineering', ug_category, 12),
                ('FT', 'Food Technology', ug_category, 13),
                ('IT', 'Information Technology', ug_category, 14),
                ('AIML', 'Artificial Intelligence & Machine Learning', ug_category, 15),
                ('AIDS', 'Artificial Intelligence & Data Science', ug_category, 16),
                ('Mech', 'Mechanical Engineering', ug_category, 17),
                ('MCT', 'Mechatronics Engineering', ug_category, 18),
                ('Robotics', 'Robotics & Automation', ug_category, 19),
                ('HS', 'Humanities & Sciences', ug_category, 20),
                ('MS', 'Management Studies', ug_category, 21),
            ]
            for code, full_name, category, order in default_departments:
                cls.objects.create(code=code, full_name=full_name, category=category, order=order)
