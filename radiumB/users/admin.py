from authentication.models import UserProfile
from .dynamic_choices_models import Year, Department

# UserProfile admin registration

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib import messages
from django.shortcuts import render, redirect
from django.urls import path
from django.http import HttpResponseRedirect
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.views import View
from event.models import Event, Participant, ODList
from event.email_services import send_registration_email
from import_export.admin import ImportExportModelAdmin
from import_export import resources

User = get_user_model()


class InternalBookingView(View):
    """Custom admin view for bulk internal booking"""

    @method_decorator(staff_member_required)
    def get(self, request):
        user_ids = request.GET.get('user_ids', '').split(',')
        user_ids = [uid for uid in user_ids if uid.strip()]

        if not user_ids:
            messages.error(request, 'No users selected.')
            return redirect('/admin/users/user/')

        try:
            users = User.objects.filter(id__in=user_ids)
            events = Event.objects.filter(is_active=True).order_by('-event_date')
        except Exception as e:
            messages.error(request, f'Error loading data: {str(e)}')
            return redirect('/admin/users/user/')

        context = {
            'users': users,
            'events': events,
            'user_ids': ','.join(user_ids),
            'title': f'Internal Booking for {users.count()} User(s)'
        }

        return render(request, 'admin/internal_booking.html', context)

    @method_decorator(staff_member_required)
    def post(self, request):
        user_ids = request.POST.get('user_ids', '').split(',')
        event_id = request.POST.get('event_id')

        if not user_ids or not event_id:
            messages.error(request, 'Missing user IDs or event ID.')
            return redirect('/admin/users/user/')

        try:
            users = User.objects.filter(id__in=user_ids)
            event = Event.objects.get(id=event_id, is_active=True)
        except Event.DoesNotExist:
            messages.error(request, 'Invalid event selected.')
            return redirect('/admin/users/user/')
        except Exception as e:
            messages.error(request, f'Error: {str(e)}')
            return redirect('/admin/users/user/')

        success_count = 0
        error_messages = []

        for user in users:
            try:
                existing_participant = Participant.objects.filter(user=user, event=event).first()

                if existing_participant:
                    if existing_participant.payment_status:
                        error_messages.append(f'{user.username}: Already fully registered')
                        continue
                    else:
                        existing_participant.payment_status = True
                        existing_participant.save()
                        participant = existing_participant
                        action = 'Payment approved for'
                else:
                    participant = Participant.objects.create(
                        user=user,
                        event=event,
                        registration_status='confirmed',
                        payment_status=True
                    )
                    action = 'Successfully booked'

                if participant.can_attend:
                    od_list = ODList.objects.create(participant=participant)
                    try:
                        send_registration_email(od_list)
                        messages.success(request, f'{action} {user.get_full_name() or user.username} for {event.event_name}.')
                        success_count += 1
                    except Exception as e:
                        messages.warning(request, f'{action} {user.get_full_name() or user.username} but email failed: {str(e)}')
                        success_count += 1
                else:
                    messages.info(request, f'{action} {user.get_full_name() or user.username} for {event.event_name} but OD not created yet.')
                    success_count += 1

            except Exception as e:
                messages.error(request, f'Error booking {user.username}: {str(e)}')

        messages.success(request, f'Processed {success_count} user(s) for {event.event_name}.')
        return redirect('/admin/users/user/')


class UserResource(resources.ModelResource):
    """Resource for importing/exporting User data"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                  'is_staff', 'is_active', 'is_superuser', 'date_joined', 'last_login')
        export_order = fields


class UserAdmin(ImportExportModelAdmin, BaseUserAdmin):
    resource_class = UserResource
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'date_joined', 'groups')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)

    # Use the default UserAdmin fieldsets (date_joined is already included)
    fieldsets = BaseUserAdmin.fieldsets

    actions = ['internal_book_selected']

    def internal_book_selected(self, request, queryset):
        """Admin action to redirect to internal booking page"""
        selected_ids = ','.join(str(user.id) for user in queryset)
        return HttpResponseRedirect(f'/admin/users/user/internal-book/?user_ids={selected_ids}')

    internal_book_selected.short_description = 'Internally book selected users for event'

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('internal-book/', InternalBookingView.as_view(), name='internal-booking'),
        ]
        return custom_urls + urls


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


# Custom form for UserProfile with dynamic choices
from django import forms


class UserProfileAdminForm(forms.ModelForm):
    """Custom form for UserProfile with dynamic year and department choices"""

    year = forms.ChoiceField(
        required=False,
        help_text="Academic year"
    )
    department = forms.ChoiceField(
        required=False,
        help_text="Department code"
    )

    class Meta:
        model = UserProfile
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Dynamically load year choices from database
        year_choices = [('', '---------')] + Year.get_choices()
        self.fields['year'].choices = year_choices

        # Dynamically load department choices from database
        dept_choices = [('', '---------')] + Department.get_choices()
        self.fields['department'].choices = dept_choices


class UserProfileResource(resources.ModelResource):
    """Resource for importing/exporting UserProfile data"""
    class Meta:
        model = UserProfile
        fields = ('id', 'user__username', 'user__email', 'display_name', 'gender', 'degree', 
                  'year', 'department', 'rollno', 'phone_number', 'college_name', 
                  'is_verified', 'is_eventStaff', 'is_superuser', 'is_qr_scanner')
        export_order = fields


@admin.register(UserProfile)
class UserProfileAdmin(ImportExportModelAdmin):
    resource_class = UserProfileResource
    form = UserProfileAdminForm
    list_display = [
        'user', 'display_name', 'gender', 'degree', 'graduation_year_display', 'department', 'rollno',
        'phone_number', 'college_name', 'is_profile_complete', 'is_eventStaff', 'is_verified', 'is_superuser'
    ]
    list_filter = ['is_eventStaff', 'is_verified', 'degree', 'year', 'department', 'college_name']
    search_fields = ['user__username', 'user__email', 'display_name', 'rollno', 'phone_number', 'college_name']
    readonly_fields = ['created_at', 'updated_at', 'graduation_year_display', 'detected_graduation_year_from_rollno']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'display_name')
        }),
        ('Academic Details', {
            'fields': ('degree', 'graduation_year_display', 'rollno', 'detected_graduation_year_from_rollno', 'department', 'college_name')
        }),
        ('Personal Information', {
            'fields': ('gender', 'phone_number', 'date_of_birth', 'bio', 'profile_picture')
        }),
        ('Status & Permissions', {
            'fields': ('is_verified', 'is_eventStaff', 'is_superuser', 'is_qr_scanner')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def graduation_year_display(self, obj):
        """Display the graduation year"""
        return obj.get_year_display()
    graduation_year_display.short_description = 'Graduation Year'
    graduation_year_display.admin_order_field = 'year'
    
    actions = ['update_graduation_year_from_rollno']
    
    def update_graduation_year_from_rollno(self, request, queryset):
        """Admin action to update graduation year based on roll number for selected profiles"""
        updated_count = 0
        skipped_count = 0
        
        for profile in queryset:
            if profile.rollno:
                detected_year = profile.get_year_from_rollno()
                if detected_year and detected_year != profile.year:
                    old_year = profile.year or 'None'
                    profile.year = detected_year
                    profile.save()
                    updated_count += 1
                    messages.success(
                        request, 
                        f"Updated {profile.user.username} (Roll: {profile.rollno}): {old_year} → {detected_year}"
                    )
                else:
                    skipped_count += 1
            else:
                skipped_count += 1
        
        if updated_count > 0:
            messages.success(request, f"Successfully updated {updated_count} user profiles.")
        if skipped_count > 0:
            messages.info(request, f"Skipped {skipped_count} profiles (no roll number or graduation year already correct).")
    
    update_graduation_year_from_rollno.short_description = "Update graduation year from roll number for selected profiles"
    
    def detected_graduation_year_from_rollno(self, obj):
        """Show what graduation year would be detected from roll number"""
        if obj.rollno:
            detected = obj.get_year_from_rollno()
            if detected:
                # Get the display name for the detected year
                # Get year display name from dynamic Year model
                try:
                    year_obj = Year.objects.get(code=detected, is_active=True)
                    year_name = year_obj.display_name
                except Year.DoesNotExist:
                    year_name = detected
                
                if detected == obj.year:
                    return f"{year_name} ✓"
                else:
                    return f"{year_name} (suggested)"
            else:
                return "Cannot detect"
        return "No roll number"
    detected_graduation_year_from_rollno.short_description = 'Detected Graduation Year'
