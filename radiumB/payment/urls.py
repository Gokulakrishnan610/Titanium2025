from django.urls import path
from . import views

app_name = 'payment'

urlpatterns = [
    path('initiate/', views.PaymentInitiateView.as_view(), name='payment_initiate'),
    path('status/<str:order_id>/', views.PaymentStatusView.as_view(), name='payment_status'),
    path('webhook/', views.PaymentWebhookView.as_view(), name='payment_webhook'),
    path('list/', views.PaymentListView.as_view(), name='payment_list'),
    path('config/', views.payment_config, name='payment_config'),
    path('create-test/', views.create_test_payment, name='create_test_payment'),
    path('test-success/', views.test_payment_success, name='test_payment_success'),
    # Admin-only configuration management
    path('config-admin/', views.PaymentConfigurationView.as_view(), name='payment_config_admin'),
    path('config-list/', views.PaymentConfigurationListView.as_view(), name='payment_config_list'),
    path('config-switch/', views.switch_payment_config, name='switch_payment_config'),
    path('process-confirmation/', views.process_payment_confirmation, name='process_payment_confirmation'),
    path('debug/', views.payment_debug, name='payment_debug'),
    path('cleanup/', views.cleanup_corrupted_payments, name='cleanup_corrupted_payments'),
    # PayU response handlers
    path('payu/success/', views.payu_success_response, name='payu_success'),
    path('payu/failure/', views.payu_failure_response, name='payu_failure'),
    path('simulate-payu/', views.simulate_payu_response, name='simulate_payu'),
]