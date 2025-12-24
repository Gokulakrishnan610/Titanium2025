from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from users.dynamic_choices_models import Year, Department


class YearResource(resources.ModelResource):
    """Resource for importing/exporting Year data"""
    class Meta:
        model = Year
        fields = ('id', 'code', 'display_name', 'is_active', 'order', 'created_at', 'updated_at')
        export_order = ('id', 'code', 'display_name', 'is_active', 'order', 'created_at', 'updated_at')


class DepartmentResource(resources.ModelResource):
    """Resource for importing/exporting Department data"""
    class Meta:
        model = Department
        fields = ('id', 'code', 'full_name', 'category', 'is_active', 'order', 'created_at', 'updated_at')
        export_order = ('id', 'code', 'full_name', 'category', 'is_active', 'order', 'created_at', 'updated_at')


@admin.register(Year)
class YearAdmin(ImportExportModelAdmin):
    """Manage graduation year choices"""
    resource_class = YearResource
    list_display = ['code', 'display_name', 'order', 'is_active', 'created_at']
    list_editable = ['order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['code', 'display_name']
    ordering = ['order', 'code']
    
    fieldsets = (
        ('Year Information', {
            'fields': ('code', 'display_name')
        }),
        ('Settings', {
            'fields': ('is_active', 'order')
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing object
            return ['created_at', 'updated_at']
        return []


@admin.register(Department)
class DepartmentAdmin(ImportExportModelAdmin):
    resource_class = DepartmentResource
    list_display = ['code', 'full_name', 'category', 'order', 'is_active', 'created_at']
    list_editable = ['order', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['code', 'full_name']
    ordering = ['category', 'order', 'code']
    
    fieldsets = (
        ('Department Information', {
            'fields': ('code', 'full_name', 'category')
        }),
        ('Settings', {
            'fields': ('is_active', 'order')
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing object
            return ['created_at', 'updated_at']
        return []
