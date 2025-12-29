from django.contrib import admin
from django.contrib import messages
from django.utils.html import format_html
from django.utils import timezone
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from .models import DevsMembership, PremiumMembershipSlot, PremiumMembershipApplication


class DevsMembershipResource(resources.ModelResource):
    """Resource for importing/exporting DevsMembership data"""
    class Meta:
        model = DevsMembership
        fields = ('id', 'user__username', 'user__email', 'membership_type', 'status', 
                  'claimed_at', 'expires_at', 'premium_upgraded_at')
        export_order = fields


@admin.register(DevsMembership)
class DevsMembershipAdmin(ImportExportModelAdmin):
    resource_class = DevsMembershipResource
    list_display = ['user', 'membership_type', 'status', 'claimed_at', 'is_active_display', 'expires_at']
    list_filter = ['membership_type', 'status', 'claimed_at']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['claimed_at', 'premium_upgraded_at']
    date_hierarchy = 'claimed_at'
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Membership Details', {
            'fields': ('membership_type', 'status', 'claimed_at', 'expires_at', 'premium_upgraded_at')
        }),
    )
    
    def is_active_display(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green;">✓ Active</span>')
        return format_html('<span style="color: red;">✗ Inactive</span>')
    is_active_display.short_description = 'Active Status'
    
    actions = ['upgrade_to_premium', 'activate_membership', 'suspend_membership']
    
    def upgrade_to_premium(self, request, queryset):
        """Admin action to upgrade selected memberships to premium"""
        updated_count = 0
        error_count = 0
        
        for membership in queryset:
            success, message = membership.upgrade_to_premium()
            if success:
                updated_count += 1
                messages.success(request, f"Upgraded {membership.user.username} to premium membership")
            else:
                error_count += 1
                messages.error(request, f"Failed to upgrade {membership.user.username}: {message}")
        
        if updated_count > 0:
            messages.success(request, f"Successfully upgraded {updated_count} memberships to premium")
        if error_count > 0:
            messages.warning(request, f"Failed to upgrade {error_count} memberships")
    
    upgrade_to_premium.short_description = "Upgrade selected memberships to premium"
    
    def activate_membership(self, request, queryset):
        """Admin action to activate selected memberships"""
        updated = queryset.update(status='active')
        messages.success(request, f"Activated {updated} memberships")
    
    activate_membership.short_description = "Activate selected memberships"
    
    def suspend_membership(self, request, queryset):
        """Admin action to suspend selected memberships"""
        updated = queryset.update(status='suspended')
        messages.success(request, f"Suspended {updated} memberships")
    
    suspend_membership.short_description = "Suspend selected memberships"


class PremiumMembershipSlotResource(resources.ModelResource):
    """Resource for importing/exporting PremiumMembershipSlot data"""
    class Meta:
        model = PremiumMembershipSlot
        fields = ('id', 'name', 'description', 'total_slots', 'allocated_slots', 
                  'is_open', 'opens_at', 'closes_at', 'created_at')
        export_order = fields


@admin.register(PremiumMembershipSlot)
class PremiumMembershipSlotAdmin(ImportExportModelAdmin):
    resource_class = PremiumMembershipSlotResource
    list_display = ['name', 'total_slots', 'allocated_slots_display', 'available_slots_display', 
                    'is_open', 'is_currently_open_display', 'opens_at', 'closes_at']
    list_filter = ['is_open', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'allocated_slots', 'available_slots']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Slot Information', {
            'fields': ('name', 'description', 'total_slots')
        }),
        ('Availability', {
            'fields': ('is_open', 'opens_at', 'closes_at')
        }),
        ('Statistics', {
            'fields': ('allocated_slots', 'available_slots', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['open_slots', 'close_slots']
    
    def allocated_slots_display(self, obj):
        return f"{obj.allocated_slots}/{obj.total_slots}"
    allocated_slots_display.short_description = 'Allocated'
    
    def available_slots_display(self, obj):
        available = obj.available_slots
        if available == 0:
            return format_html('<span style="color: red;">{} (Full)</span>', available)
        elif available < 5:
            return format_html('<span style="color: orange;">{}</span>', available)
        return format_html('<span style="color: green;">{}</span>', available)
    available_slots_display.short_description = 'Available'
    
    def is_currently_open_display(self, obj):
        if obj.is_currently_open:
            return format_html('<span style="color: green;">✓ Open</span>')
        return format_html('<span style="color: gray;">✗ Closed</span>')
    is_currently_open_display.short_description = 'Currently Open'
    
    def open_slots(self, request, queryset):
        updated = queryset.update(is_open=True)
        self.message_user(request, f'{updated} slot(s) opened successfully.')
    open_slots.short_description = 'Open selected slots'
    
    def close_slots(self, request, queryset):
        updated = queryset.update(is_open=False)
        self.message_user(request, f'{updated} slot(s) closed successfully.')
    close_slots.short_description = 'Close selected slots'


class PremiumMembershipApplicationResource(resources.ModelResource):
    """Resource for importing/exporting PremiumMembershipApplication data"""
    class Meta:
        model = PremiumMembershipApplication
        fields = ('id', 'user__username', 'user__email', 'slot__name', 'status', 
                  'application_reason', 'applied_at', 'reviewed_by__username', 'reviewed_at')
        export_order = fields


@admin.register(PremiumMembershipApplication)
class PremiumMembershipApplicationAdmin(ImportExportModelAdmin):
    resource_class = PremiumMembershipApplicationResource
    list_display = ['user', 'slot', 'status', 'applied_at', 'reviewed_at', 'reviewed_by']
    list_filter = ['status', 'applied_at', 'slot']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name', 
                     'application_reason', 'review_notes']
    readonly_fields = ['applied_at', 'reviewed_at']
    date_hierarchy = 'applied_at'
    
    fieldsets = (
        ('Application Information', {
            'fields': ('user', 'slot', 'status', 'applied_at')
        }),
        ('Application Details', {
            'fields': ('application_reason',)
        }),
        ('Review Information', {
            'fields': ('reviewed_at', 'reviewed_by', 'review_notes')
        }),
    )
    
    actions = ['approve_applications', 'reject_applications', 'move_to_waitlist']
    
    def approve_applications(self, request, queryset):
        success_count = 0
        error_count = 0
        
        for application in queryset:
            success, message = application.approve(reviewed_by=request.user)
            if success:
                success_count += 1
            else:
                error_count += 1
        
        if success_count:
            self.message_user(request, f'{success_count} application(s) approved successfully.')
        if error_count:
            self.message_user(request, f'{error_count} application(s) could not be approved.', level='warning')
    approve_applications.short_description = 'Approve selected applications'
    
    def reject_applications(self, request, queryset):
        for application in queryset:
            application.reject(reviewed_by=request.user)
        self.message_user(request, f'{queryset.count()} application(s) rejected.')
    reject_applications.short_description = 'Reject selected applications'
    
    def move_to_waitlist(self, request, queryset):
        updated = queryset.update(status='waitlist')
        self.message_user(request, f'{updated} application(s) moved to waitlist.')
    move_to_waitlist.short_description = 'Move to waitlist'
