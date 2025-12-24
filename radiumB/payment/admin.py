from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from .models import Payment, PaymentWebhook


class PaymentResource(resources.ModelResource):
    """Resource for importing/exporting Payment data"""
    class Meta:
        model = Payment
        fields = ('id', 'event__event_name', 'participant__user__username', 'participant__user__email',
                  'amount', 'currency', 'status', 'cf_payment_id', 'cf_order_id', 'created_at', 'updated_at')
        export_order = fields


class PaymentWebhookResource(resources.ModelResource):
    """Resource for importing/exporting PaymentWebhook data"""
    class Meta:
        model = PaymentWebhook
        fields = ('id', 'payment__id', 'payment__cf_payment_id', 'webhook_type', 'created_at')
        export_order = fields


@admin.register(Payment)
class PaymentAdmin(ImportExportModelAdmin):
    resource_class = PaymentResource
    list_display = ('id', 'event', 'participant', 'amount', 'currency', 'status', 'cf_payment_id', 'created_at')
    list_filter = ('status', 'currency', 'created_at')
    search_fields = ('id', 'cf_payment_id', 'participant__user__email')
    readonly_fields = ('id', 'cf_payment_id', 'cf_order_id', 'created_at', 'updated_at')


@admin.register(PaymentWebhook)
class PaymentWebhookAdmin(ImportExportModelAdmin):
    resource_class = PaymentWebhookResource
    list_display = ('id', 'payment', 'webhook_type', 'created_at')
    list_filter = ('webhook_type', 'created_at')
    search_fields = ('payment__id', 'payment__cf_payment_id')
    readonly_fields = ('id', 'payment', 'webhook_type', 'payload', 'signature', 'created_at')
