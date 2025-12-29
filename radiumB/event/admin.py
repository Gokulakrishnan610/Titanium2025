from django.contrib import admin
from django.contrib.auth import get_user_model
from django.shortcuts import redirect, render
from django.urls import path
from django.utils.html import format_html
from django.contrib import messages
from .models import Event, ODList, Participant, EventGuide, EventQuestion, EventCategory
from .email_services import send_registration_email, send_qr_email_to_participant, get_participant_qr_status_html, create_participant_with_od
from import_export.admin import ImportExportModelAdmin
from import_export import resources

User = get_user_model()


class EventQuestionInline(admin.TabularInline):
    """Inline admin for EventQuestion"""
    model = EventQuestion
    extra = 1
    fields = ('label', 'question_type', 'required', 'order', 'help_text', 'options')
    ordering = ['order', 'id']

class ParticipantInline(admin.TabularInline):
    model = Participant
    extra = 0
    readonly_fields = ('registered_at', 'updated_at')
    fields = ('user', 'registration_status', 'payment_status', 'registered_at')
    can_delete = True

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "user":
            if hasattr(request, '_current_event'):
                registered_users = Participant.objects.filter(
                    event=request._current_event
                ).values_list('user_id', flat=True)
                kwargs["queryset"] = User.objects.exclude(id__in=registered_users)
            else:
                kwargs["queryset"] = User.objects.all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


def internal_booking_view(request):
    """Admin view for booking users to events"""
    event_id = request.GET.get('event_id')
    if not event_id:
        messages.error(request, 'No event selected.')
        return redirect('admin:event_event_changelist')

    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        messages.error(request, 'Event not found.')
        return redirect('admin:event_event_changelist')

    if request.method == 'POST':
        selected_user_ids = request.POST.getlist('users')
        if not selected_user_ids:
            messages.error(request, 'No users selected.')
            return redirect(f"{request.path}?event_id={event_id}")

        success_count = 0
        for user_id in selected_user_ids:
            try:
                user = User.objects.get(pk=user_id)
                result = create_participant_with_od(user, event, send_email=True)

                if result['success']:
                    messages.success(request, f'{user.username}: {result["message"]}')
                    success_count += 1
                else:
                    messages.warning(request, f'{user.username}: {result["message"]}')

            except User.DoesNotExist:
                messages.error(request, f'User with ID {user_id} not found.')
            except Exception as e:
                messages.error(request, f'Error booking user {user_id}: {str(e)}')

        if success_count > 0:
            messages.success(request, f'Successfully processed {success_count} booking(s) for {event.event_name}.')

        return redirect('admin:event_event_changelist')

    registered_user_ids = Participant.objects.filter(event=event).values_list('user_id', flat=True)
    available_users = User.objects.exclude(id__in=registered_user_ids).order_by('username')

    context = {
        'title': f'Book Users for {event.event_name}',
        'event': event,
        'available_users': available_users,
        'opts': Event._meta,
    }

    return render(request, 'admin/internal_booking_form.html', context)

original_get_urls = admin.site.get_urls

def get_urls_with_internal_booking():
    urls = original_get_urls()
    custom_urls = [
        path('internal-booking/', admin.site.admin_view(internal_booking_view), name='internal_booking'),
    ]
    return custom_urls + urls

admin.site.get_urls = get_urls_with_internal_booking

class EventResource(resources.ModelResource):
    """Resource for importing/exporting Event data"""
    class Meta:
        model = Event
        fields = ('id', 'event_name', 'event_date', 'event_time', 'venue', 'description', 
                  'max_participants', 'registration_fee', 'is_active', 'created_at')
        export_order = fields


@admin.register(Event)
class EventAdmin(ImportExportModelAdmin):
    resource_class = EventResource
    list_display = [
        'event_name',
        'event_date',
        'event_type',
        'payment_type',
        'gateway_options',
        'participation_type',
        'is_active',
        'is_upcoming',
        'participant_count',
        'created_at'
    ]

    list_filter = [
        'event_type',
        'payment_type',
        'gateway_options',
        'participation_type',
        'is_active',
        'event_date',
        'created_at'
    ]

    search_fields = ['event_name', 'description', 'venue']

    readonly_fields = ['created_at', 'updated_at', 'is_upcoming', 'is_registration_open', 'od_status_detail']

    fieldsets = (
        ('Basic Information', {
            'fields': ('event_name', 'description', 'venue')
        }),
        ('Event Details', {
            'fields': ('event_type', 'event_date', 'start_time', 'end_time', 'payment_type', 'participation_type')
        }),
        ('Media', {
            'fields': ('event_image', 'event_video')
        }),
        ('Registration Details', {
            'fields': ('price', 'max_participants', 'registration_deadline')
        }),
        ('Payment Gateway', {
            'fields': ('gateway_options', 'gateway_credentials'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('OD/QR Status', {
            'fields': ('od_status_detail',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'is_upcoming', 'is_registration_open'),
            'classes': ('collapse',)
        }),
    )

    inlines = [EventQuestionInline, ParticipantInline]
    actions = ['send_qr_emails_bulk', 'resend_qr_emails_bulk', 'internal_book_users']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related().prefetch_related('participants')

    def is_upcoming(self, obj):
        return obj.is_upcoming
    is_upcoming.boolean = True
    is_upcoming.short_description = 'Upcoming'

    def participant_count(self, obj):
        return obj.participants.count()
    participant_count.short_description = 'Participants'

    def od_status_summary(self, obj):
        """Show OD/QR status summary for the event"""
        participants = obj.participants.filter(registration_status='confirmed', payment_status=True)
        total_participants = participants.count()

        if total_participants == 0:
            return format_html('<span style="color: gray;">No eligible participants</span>')

        od_entries = ODList.objects.filter(participant__in=participants)
        qr_sent_count = od_entries.filter(qr_sent=True).count()
        total_od_entries = od_entries.count()

        if total_od_entries == 0:
            return format_html('<span style="color: orange;">{} eligible, {} OD entries</span>',
                             total_participants, total_od_entries)

        percentage = int((qr_sent_count / total_od_entries) * 100)

        if qr_sent_count == total_od_entries:
            color = 'green'
            status = 'Complete'
        elif qr_sent_count > 0:
            color = 'orange'
            status = 'Partial'
        else:
            color = 'red'
            status = 'None'

        return format_html(
            '<span style="color: {};">{} ({}%)</span>',
            color, status, percentage
        )
    od_status_summary.short_description = 'OD/QR Status'

    def od_status_detail(self, obj):
        """Show detailed OD/QR status for the event"""
        participants = obj.participants.filter(registration_status='confirmed', payment_status=True)
        total_eligible = participants.count()

        if total_eligible == 0:
            return "No eligible participants (confirmed registration + payment completed)"

        od_entries = ODList.objects.filter(participant__in=participants)
        total_od = od_entries.count()
        qr_sent = od_entries.filter(qr_sent=True).count()
        qr_not_sent = total_od - qr_sent

        detail = f"Eligible participants: {total_eligible}\n"
        detail += f"OD entries created: {total_od}\n"
        detail += f"QR emails sent: {qr_sent}\n"
        detail += f"QR emails pending: {qr_not_sent}"

        if total_od < total_eligible:
            detail += f"\n {total_eligible - total_od} participants missing OD entries"

        return detail
    od_status_detail.short_description = 'OD/QR Status Details'

    def send_qr_emails_bulk(self, request, queryset):
        """Send QR code emails to all eligible participants of selected events"""
        total_sent = 0
        total_failed = 0

        for event in queryset:
            participants = event.participants.filter(
                registration_status='confirmed',
                payment_status=True
            )

            for participant in participants:
                try:
                    od_list = ODList.objects.get(participant=participant)
                    if not od_list.qr_sent: 
                        try:
                            if send_registration_email(od_list):
                                od_list.qr_sent = True
                                od_list.save(update_fields=['qr_sent'])
                                total_sent += 1
                            else:
                                total_failed += 1
                        except Exception as e:
                            total_failed += 1
                            self.message_user(
                                request,
                                f'Failed to send email for {event.event_name} to {participant.user.email}: {str(e)}',
                                messages.ERROR
                            )
                except ODList.DoesNotExist:
                    try:
                        od_list = ODList.objects.create(participant=participant)
                        if send_registration_email(od_list):
                            total_sent += 1
                        else:
                            total_failed += 1
                    except Exception as e:
                        total_failed += 1
                        self.message_user(
                            request,
                            f'Failed to create OD and send email for {event.event_name} to {participant.user.email}: {str(e)}',
                            messages.ERROR
                        )

        if total_sent > 0:
            self.message_user(
                request,
                f'Successfully sent {total_sent} QR code emails.',
                messages.SUCCESS
            )
        if total_failed > 0:
            self.message_user(
                request,
                f'Failed to send {total_failed} emails.',
                messages.WARNING
            )
    send_qr_emails_bulk.short_description = 'Send QR emails to all eligible participants'

    def resend_qr_emails_bulk(self, request, queryset):
        """Resend QR code emails to all participants of selected events (force send)"""
        total_sent = 0
        total_failed = 0

        for event in queryset:
            participants = event.participants.filter(
                registration_status='confirmed',
                payment_status=True
            )

            for participant in participants:
                try:
                    od_list = ODList.objects.get(participant=participant)
                    try:
                        if send_registration_email(od_list):
                            od_list.qr_sent = True
                            od_list.save(update_fields=['qr_sent'])
                            total_sent += 1
                        else:
                            total_failed += 1
                    except Exception as e:
                        total_failed += 1
                        self.message_user(
                            request,
                            f'Failed to resend email for {event.event_name} to {participant.user.email}: {str(e)}',
                            messages.ERROR
                        )
                except ODList.DoesNotExist:
                    try:
                        od_list = ODList.objects.create(participant=participant)
                        if send_registration_email(od_list):
                            total_sent += 1
                        else:
                            total_failed += 1
                    except Exception as e:
                        total_failed += 1

        if total_sent > 0:
            self.message_user(
                request,
                f'Successfully resent {total_sent} QR code emails.',
                messages.SUCCESS
            )
        if total_failed > 0:
            self.message_user(
                request,
                f'Failed to resend {total_failed} emails.',
                messages.WARNING
            )
    resend_qr_emails_bulk.short_description = 'Resend QR emails to all participants (force)'

    def internal_book_users(self, request, queryset):
        """Action to book users for selected events - redirects to booking form"""
        if queryset.count() != 1:
            messages.error(request, 'Please select exactly one event for internal booking.')
            return

        event = queryset.first()
        event_id = event.pk

        from django.urls import reverse
        booking_url = reverse('admin:internal_booking') + f'?event_id={event_id}'
        return redirect(booking_url)

    internal_book_users.short_description = 'Book users for selected event'

    def get_form(self, request, obj=None, **kwargs):
        if obj:
            request._current_event = obj
        return super().get_form(request, obj, **kwargs)

    def save_formset(self, request, form, formset, change):
        """Handle participant creation with OD list generation"""
        instances = formset.save(commit=False)

        for instance in instances:
            if isinstance(instance, Participant):
                if not instance.pk:
                    instance.payment_status = True
                    instance.registration_status = 'confirmed'

                    if instance.can_attend:
                        from .models import ODList
                        od_list = ODList.objects.create(participant=instance)
                        try:
                            send_registration_email(od_list)
                            messages.success(
                                request,
                                f'Successfully registered {instance.user.get_full_name() or instance.user.username} and sent email.'
                            )
                        except Exception as e:
                            messages.warning(
                                request,
                                f'Registered {instance.user.get_full_name() or instance.user.username} but email failed: {str(e)}'
                            )
                    else:
                        messages.info(
                            request,
                            f'Registered {instance.user.get_full_name() or instance.user.username} but OD not created yet.'
                        )

            instance.save()

        formset.save_m2m()


class ODListResource(resources.ModelResource):
    """Resource for importing/exporting ODList data"""
    class Meta:
        model = ODList
        fields = ('id', 'participant__user__username', 'participant__event__event_name', 
                  'hash', 'attendance', 'qr_sent', 'attendance_marked_at', 'created_at')
        export_order = fields


@admin.register(ODList)
class ODListAdmin(ImportExportModelAdmin):
    resource_class = ODListResource
    list_display = ('participant', 'hash', 'attendance', 'qr_sent', 'attendance_marked_at', 'event_name', 'user_email')
    list_filter = ('attendance', 'qr_sent', 'participant__event__event_name')
    search_fields = ('participant__user__username', 'participant__user__email', 'hash')
    readonly_fields = ('hash', 'attendance_marked_at')
    actions = ['mark_attendance', 'unmark_attendance', 'send_qr_email', 'resend_qr_email']

    def event_name(self, obj):
        return obj.participant.event.event_name
    event_name.short_description = 'Event'
    event_name.admin_order_field = 'participant__event__event_name'

    def user_email(self, obj):
        return obj.participant.user.email
    user_email.short_description = 'User Email'
    user_email.admin_order_field = 'participant__user__email'

    def mark_attendance(self, request, queryset):
        updated = queryset.update(attendance=True)
        self.message_user(request, f'{updated} entries marked as attended.')
    mark_attendance.short_description = 'Mark selected as attended'

    def unmark_attendance(self, request, queryset):
        updated = queryset.update(attendance=False, attendance_marked_at=None)
        self.message_user(request, f'{updated} entries unmarked.')
    unmark_attendance.short_description = 'Unmark attendance'

    def send_qr_email(self, request, queryset):
        """Send QR code email to selected OD entries"""
        sent_count = 0
        failed_count = 0

        for od_list in queryset:
            try:
                if send_registration_email(od_list):
                    od_list.qr_sent = True
                    od_list.save(update_fields=['qr_sent'])
                    sent_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                failed_count += 1
                self.message_user(
                    request,
                    f'Failed to send email to {od_list.participant.user.email}: {str(e)}',
                    messages.ERROR
                )

        if sent_count > 0:
            self.message_user(
                request,
                f'Successfully sent {sent_count} QR code emails.',
                messages.SUCCESS
            )
        if failed_count > 0:
            self.message_user(
                request,
                f'Failed to send {failed_count} emails.',
                messages.WARNING
            )
    send_qr_email.short_description = 'Send QR code email to selected'

    def resend_qr_email(self, request, queryset):
        """Resend QR code email to selected OD entries (force send even if already sent)"""
        sent_count = 0
        failed_count = 0

        for od_list in queryset:
            try:
                if send_registration_email(od_list):
                    od_list.qr_sent = True
                    od_list.save(update_fields=['qr_sent'])
                    sent_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                failed_count += 1
                self.message_user(
                    request,
                    f'Failed to resend email to {od_list.participant.user.email}: {str(e)}',
                    messages.ERROR
                )

        if sent_count > 0:
            self.message_user(
                request,
                f'Successfully resent {sent_count} QR code emails.',
                messages.SUCCESS
            )
        if failed_count > 0:
            self.message_user(
                request,
                f'Failed to resend {failed_count} emails.',
                messages.WARNING
            )
    resend_qr_email.short_description = 'Resend QR code email to selected (force)'


class ParticipantResource(resources.ModelResource):
    """Resource for importing/exporting Participant data"""
    class Meta:
        model = Participant
        fields = ('id', 'user__username', 'user__email', 'event__event_name', 
                  'registration_status', 'payment_status', 'registered_at', 'form_data')
        export_order = fields


@admin.register(Participant)
class ParticipantAdmin(ImportExportModelAdmin):
    resource_class = ParticipantResource
    list_display = ('user', 'event', 'registration_status', 'payment_status', 'od_status', 'qr_status', 'attendance_status', 'registered_at')
    list_filter = ('registration_status', 'payment_status', 'event__event_type')
    search_fields = ('user__username', 'user__email', 'event__event_name')
    readonly_fields = ('registered_at',)
    actions = ['confirm_registrations', 'mark_as_paid', 'admin_unregister', 'send_qr_email_individual', 'resend_qr_email_individual']

    def confirm_registrations(self, request, queryset):
        updated = queryset.update(registration_status=True)
        self.message_user(request, f'{updated} registrations confirmed.')
    confirm_registrations.short_description = 'Confirm selected registrations'

    def mark_as_paid(self, request, queryset):
        updated = queryset.update(payment_status=True)
        self.message_user(request, f'{updated} marked as paid.')
    mark_as_paid.short_description = 'Mark selected as paid'

    def admin_unregister(self, request, queryset):
        """Admin action to unregister selected participants"""
        deleted_count = 0
        for participant in queryset:
            user_name = participant.user.get_full_name() or participant.user.username
            event_name = participant.event.event_name
            participant.delete()
            deleted_count += 1

        self.message_user(
            request,
            f'Successfully unregistered {deleted_count} participant(s).',
            messages.SUCCESS
        )
    admin_unregister.short_description = 'Unregister selected participants'

    def send_qr_email_individual(self, request, queryset):
        """Send QR code email to selected participants (only if not already sent)"""
        sent_count = 0
        skipped_count = 0
        failed_count = 0

        for participant in queryset:
            result = send_qr_email_to_participant(participant, force=False)

            if result['success']:
                sent_count += 1
                messages.success(request, f'{participant.user.username}: {result["message"]}')
            elif 'already sent' in result['message']:
                skipped_count += 1
                messages.info(request, f'{participant.user.username}: {result["message"]}')
            else:
                failed_count += 1
                messages.error(request, f'{participant.user.username}: {result["message"]}')

        summary_parts = []
        if sent_count > 0:
            summary_parts.append(f'{sent_count} sent')
        if skipped_count > 0:
            summary_parts.append(f'{skipped_count} skipped')
        if failed_count > 0:
            summary_parts.append(f'{failed_count} failed')

        if summary_parts:
            messages.info(request, f'Email sending complete: {", ".join(summary_parts)}')

    send_qr_email_individual.short_description = 'Send QR email to selected participants'

    def resend_qr_email_individual(self, request, queryset):
        """Force resend QR code email to selected participants (even if already sent)"""
        sent_count = 0
        failed_count = 0

        for participant in queryset:
            result = send_qr_email_to_participant(participant, force=True)

            if result['success']:
                sent_count += 1
                messages.success(request, f'{participant.user.username}: {result["message"]}')
            else:
                failed_count += 1
                messages.error(request, f'{participant.user.username}: {result["message"]}')

        if sent_count > 0:
            messages.success(request, f'Successfully resent {sent_count} QR email(s)')
        if failed_count > 0:
            messages.warning(request, f'Failed to resend {failed_count} email(s)')

    resend_qr_email_individual.short_description = 'Force resend QR email to selected participants'

    def qr_status(self, obj):
        """Show QR email status for this participant"""
        return get_participant_qr_status_html(obj)
    qr_status.short_description = 'QR Status'
    qr_status.admin_order_field = 'participant__odlist__qr_sent'

    def od_status(self, obj):
        """Show OD status for this participant"""
        try:
            od_entry = ODList.objects.get(participant=obj)
            return format_html('<span style="color: green;">✅ Has OD</span>')
        except ODList.DoesNotExist:
            return format_html('<span style="color: red;">❌ No OD</span>')
    od_status.short_description = 'OD Status'

    def attendance_status(self, obj):
        """Show attendance status for this participant"""
        try:
            od_entry = ODList.objects.get(participant=obj)
            if od_entry.attendance:
                return format_html('<span style="color: green;">✅ Attended</span>')
            else:
                return format_html('<span style="color: orange;">⏳ Not Attended</span>')
        except ODList.DoesNotExist:
            return format_html('<span style="color: gray;">N/A</span>')
    attendance_status.short_description = 'Attendance'


class EventGuideResource(resources.ModelResource):
    """Resource for importing/exporting EventGuide data"""
    class Meta:
        model = EventGuide
        fields = ('id', 'event__event_name', 'title', 'content', 'video_url', 
                  'order', 'is_active', 'created_at')
        export_order = fields


@admin.register(EventGuide)
class EventGuideAdmin(ImportExportModelAdmin):
    resource_class = EventGuideResource
    """Admin interface for EventGuide model"""
    
    list_display = ('event', 'language', 'duration', 'venue', 'layout', 'created_at')
    list_filter = ('language', 'layout', 'seating_arrangement', 'entry_allowed_for')
    search_fields = ('event__event_name', 'duration', 'tickets_needed_for', 'venue')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Event Information', {
            'fields': ('event',)
        }),
        ('Event Details', {
            'fields': ('language', 'duration', 'tickets_needed_for', 'entry_allowed_for')
        }),
        ('Venue & Logistics', {
            'fields': ('venue', 'layout', 'seating_arrangement')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('event')


class EventQuestionResource(resources.ModelResource):
    """Resource for importing/exporting EventQuestion data"""
    class Meta:
        model = EventQuestion
        fields = ('id', 'event__event_name', 'label', 'question_type', 'required', 
                  'order', 'help_text', 'options', 'created_at')
        export_order = fields


@admin.register(EventQuestion)
class EventQuestionAdmin(ImportExportModelAdmin):
    resource_class = EventQuestionResource
    """Admin interface for EventQuestion model"""
    
    list_display = ('label', 'event', 'question_type', 'required', 'order', 'created_at')
    list_filter = ('question_type', 'required', 'event')
    search_fields = ('label', 'event__event_name', 'help_text')
    readonly_fields = ('created_at',)
    ordering = ('event', 'order', 'id')
    
    fieldsets = (
        ('Question Details', {
            'fields': ('event', 'label', 'question_type', 'required', 'order')
        }),
        ('Additional Information', {
            'fields': ('help_text', 'options')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('event')


class EventCategoryResource(resources.ModelResource):
    """Resource for importing/exporting EventCategory data"""
    class Meta:
        model = EventCategory
        fields = ('id', 'code', 'display_name', 'description', 'is_active', 'order', 'created_at', 'updated_at')
        export_order = ('id', 'code', 'display_name', 'description', 'is_active', 'order', 'created_at', 'updated_at')


@admin.register(EventCategory)
class EventCategoryAdmin(ImportExportModelAdmin):
    """Admin interface for EventCategory model"""
    resource_class = EventCategoryResource
    list_display = ['code', 'display_name', 'order', 'is_active', 'event_count', 'created_at']
    list_editable = ['order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['code', 'display_name', 'description']
    ordering = ['order', 'code']
    
    fieldsets = (
        ('Category Information', {
            'fields': ('code', 'display_name', 'description')
        }),
        ('Settings', {
            'fields': ('is_active', 'order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'event_count')
    
    def event_count(self, obj):
        """Show number of events using this category"""
        count = obj.event_set.count()
        if count > 0:
            return format_html('<a href="/admin/event/event/?event_type__id__exact={}">{} events</a>', obj.id, count)
        return '0 events'
    event_count.short_description = 'Events Using Category'
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing object
            return self.readonly_fields + ('event_count',)
        return self.readonly_fields