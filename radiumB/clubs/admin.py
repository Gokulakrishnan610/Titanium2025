from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from .models import Club, ClubMembership, ClubSettings
from import_export.admin import ImportExportModelAdmin
from import_export import resources

User = get_user_model()


class ClubMembershipInline(admin.TabularInline):
    """Inline admin for ClubMembership"""
    model = ClubMembership
    extra = 1
    fields = ('user', 'role', 'status', 'can_create_events', 'can_manage_members', 'can_manage_payments', 'can_view_analytics')
    readonly_fields = ('joined_at',)


class ClubSettingsInline(admin.StackedInline):
    """Inline admin for ClubSettings"""
    model = ClubSettings
    extra = 0
    fields = (
        'email_signature', 'notification_emails',
        'default_event_duration', 'auto_approve_events', 'max_events_per_month',
        'default_registration_deadline_days', 'allow_late_registration',
        'default_currency', 'payment_terms',
        'social_links', 'custom_fields'
    )
    classes = ('collapse',)


class ClubResource(resources.ModelResource):
    """Resource for importing/exporting Club data"""
    class Meta:
        model = Club
        fields = ('id', 'name', 'slug', 'club_type', 'email', 'phone', 'website', 
                  'status', 'is_default', 'payment_gateway', 'created_at')
        export_order = fields


@admin.register(Club)
class ClubAdmin(ImportExportModelAdmin):
    resource_class = ClubResource
    list_display = [
        'name',
        'club_type',
        'status',
        'is_default',
        'total_members_display',
        'total_events_display',
        'payment_gateway',
        'created_at'
    ]
    
    list_filter = [
        'club_type',
        'status',
        'is_default',
        'payment_gateway',
        'created_at'
    ]
    
    search_fields = ['name', 'slug', 'email', 'description']
    
    readonly_fields = ['created_at', 'updated_at', 'total_events', 'total_members']
    
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'club_type', 'status')
        }),
        ('Contact Information', {
            'fields': ('email', 'phone', 'website')
        }),
        ('Visual Identity', {
            'fields': ('logo', 'banner', 'primary_color', 'secondary_color'),
            'classes': ('collapse',)
        }),
        ('Settings', {
            'fields': ('is_default', 'allow_public_events', 'require_approval')
        }),
        ('Payment Configuration', {
            'fields': ('payment_gateway', 'gateway_credentials'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('total_events', 'total_members'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ClubMembershipInline, ClubSettingsInline]
    actions = ['make_default', 'activate_clubs', 'deactivate_clubs']
    
    def total_members_display(self, obj):
        count = obj.total_members
        if count > 0:
            url = reverse('admin:clubs_clubmembership_changelist') + f'?club__id__exact={obj.id}'
            return format_html('<a href="{}">{} members</a>', url, count)
        return '0 members'
    total_members_display.short_description = 'Members'
    
    def total_events_display(self, obj):
        count = obj.total_events
        if count > 0:
            url = reverse('admin:event_event_changelist') + f'?club__id__exact={obj.id}'
            return format_html('<a href="{}">{} events</a>', url, count)
        return '0 events'
    total_events_display.short_description = 'Events'
    
    def make_default(self, request, queryset):
        """Make selected club the default club"""
        if queryset.count() != 1:
            messages.error(request, 'Please select exactly one club to make default.')
            return
        
        club = queryset.first()
        Club.objects.filter(is_default=True).update(is_default=False)
        club.is_default = True
        club.save()
        
        messages.success(request, f'{club.name} is now the default club.')
    make_default.short_description = 'Make selected club default'
    
    def activate_clubs(self, request, queryset):
        """Activate selected clubs"""
        updated = queryset.update(status='active')
        messages.success(request, f'{updated} club(s) activated.')
    activate_clubs.short_description = 'Activate selected clubs'
    
    def deactivate_clubs(self, request, queryset):
        """Deactivate selected clubs"""
        updated = queryset.update(status='inactive')
        messages.success(request, f'{updated} club(s) deactivated.')
    deactivate_clubs.short_description = 'Deactivate selected clubs'


class ClubMembershipResource(resources.ModelResource):
    """Resource for importing/exporting ClubMembership data"""
    class Meta:
        model = ClubMembership
        fields = ('id', 'club__name', 'user__username', 'user__email', 'role', 'status',
                  'can_create_events', 'can_manage_members', 'can_manage_payments', 'joined_at')
        export_order = fields


@admin.register(ClubMembership)
class ClubMembershipAdmin(ImportExportModelAdmin):
    resource_class = ClubMembershipResource
    list_display = [
        'user',
        'club',
        'role',
        'status',
        'permissions_summary',
        'joined_at'
    ]
    
    list_filter = [
        'role',
        'status',
        'club',
        'can_create_events',
        'can_manage_members',
        'can_manage_payments',
        'joined_at'
    ]
    
    search_fields = ['user__username', 'user__email', 'club__name']
    
    readonly_fields = ['joined_at', 'updated_at']
    
    fieldsets = (
        ('Membership Details', {
            'fields': ('club', 'user', 'role', 'status')
        }),
        ('Permissions', {
            'fields': ('can_create_events', 'can_manage_members', 'can_manage_payments', 'can_view_analytics')
        }),
        ('Timestamps', {
            'fields': ('joined_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_memberships', 'deactivate_memberships', 'promote_to_admin', 'demote_to_member']
    
    def permissions_summary(self, obj):
        """Show a summary of user permissions"""
        perms = []
        if obj.can_create_events:
            perms.append('Events')
        if obj.can_manage_members:
            perms.append('Members')
        if obj.can_manage_payments:
            perms.append('Payments')
        if obj.can_view_analytics:
            perms.append('Analytics')
        
        if perms:
            return ', '.join(perms)
        return 'No special permissions'
    permissions_summary.short_description = 'Permissions'
    
    def activate_memberships(self, request, queryset):
        """Activate selected memberships"""
        updated = queryset.update(status='active')
        messages.success(request, f'{updated} membership(s) activated.')
    activate_memberships.short_description = 'Activate selected memberships'
    
    def deactivate_memberships(self, request, queryset):
        """Deactivate selected memberships"""
        updated = queryset.update(status='inactive')
        messages.success(request, f'{updated} membership(s) deactivated.')
    deactivate_memberships.short_description = 'Deactivate selected memberships'
    
    def promote_to_admin(self, request, queryset):
        """Promote selected members to admin role"""
        updated = queryset.update(role='admin')
        messages.success(request, f'{updated} member(s) promoted to admin.')
    promote_to_admin.short_description = 'Promote to admin'
    
    def demote_to_member(self, request, queryset):
        """Demote selected users to member role"""
        updated = queryset.update(role='member')
        messages.success(request, f'{updated} user(s) demoted to member.')
    demote_to_member.short_description = 'Demote to member'


class ClubSettingsResource(resources.ModelResource):
    """Resource for importing/exporting ClubSettings data"""
    class Meta:
        model = ClubSettings
        fields = ('id', 'club__name', 'default_event_duration', 'auto_approve_events',
                  'default_registration_deadline_days', 'allow_late_registration', 'default_currency')
        export_order = fields


@admin.register(ClubSettings)
class ClubSettingsAdmin(ImportExportModelAdmin):
    resource_class = ClubSettingsResource
    list_display = [
        'club',
        'default_event_duration',
        'auto_approve_events',
        'allow_late_registration',
        'default_currency',
        'updated_at'
    ]
    
    list_filter = [
        'auto_approve_events',
        'allow_late_registration',
        'default_currency',
        'updated_at'
    ]
    
    search_fields = ['club__name']
    
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Club', {
            'fields': ('club',)
        }),
        ('Email Settings', {
            'fields': ('email_signature', 'notification_emails')
        }),
        ('Event Settings', {
            'fields': ('default_event_duration', 'auto_approve_events', 'max_events_per_month')
        }),
        ('Registration Settings', {
            'fields': ('default_registration_deadline_days', 'allow_late_registration')
        }),
        ('Payment Settings', {
            'fields': ('default_currency', 'payment_terms')
        }),
        ('Social Media', {
            'fields': ('social_links',),
            'classes': ('collapse',)
        }),
        ('Custom Fields', {
            'fields': ('custom_fields',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )