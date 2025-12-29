from django.urls import path
from . import views

app_name = 'event'

urlpatterns = [
    # ========== CLASS-BASED VIEW ENDPOINTS ==========
    # Public endpoints
    path('events/', views.EventListAPIView.as_view(), name='event_list'),
    path('events/<int:pk>/', views.EventDetailAPIView.as_view(), name='event_detail'),
    path('events/upcoming/', views.UpcomingEventsAPIView.as_view(), name='upcoming_events'),
    
    # Protected endpoints (Admin only)
    path('events/create/', views.EventCreateAPIView.as_view(), name='event_create'),
    path('events/<int:pk>/update/', views.EventUpdateAPIView.as_view(), name='event_update'),
    path('events/<int:pk>/delete/', views.EventDeleteAPIView.as_view(), name='event_delete'),
    
    # ========== EVENT REGISTRATION ENDPOINTS ==========
    # Event registration (User authentication required)
    path('events/<int:event_id>/register/', views.EventRegistrationAPIView.as_view(), name='event_register'),

    # Admin-only unregister (Admin can remove any user's registration)
    path('events/<int:event_id>/admin-unregister/', views.EventAdminUnregisterAPIView.as_view(), name='admin_event_unregister'),
    path('events/<int:event_id>/registration-status/', views.EventRegistrationStatusAPIView.as_view(), name='event_registration_status'),
    
    # User registrations
    path('user/registrations/', views.UserRegistrationsAPIView.as_view(), name='user_registrations'),
    
    # Event participants (Admin only)
    path('events/<int:event_id>/participants/', views.EventParticipantsAPIView.as_view(), name='event_participants'),

    # Internal booking - Admin can add participants bypassing payment (Admin only)
    path('events/<int:event_id>/internal-book/', views.InternalBookingAPIView.as_view(), name='internal_booking'),
    
    # Available users for internal booking (Admin only)
    path('events/<int:event_id>/available-users/', views.AvailableUsersForBookingAPIView.as_view(), name='event_available_users'),
    
    # Event analysis (Admin only)
    path('events/<int:event_id>/analysis/download/', views.EventAnalysisDownloadAPIView.as_view(), name='event_analysis_download'),

    # Event OD list (Staff only)
    path('events/<int:event_id>/od-list/', views.EventODListAPIView.as_view(), name='event_od_list'),
    path('events/<int:event_id>/od-list/download/', views.EventODListDownloadAPIView.as_view(), name='event_od_list_download'),
    
    # ========== EVENT GUIDE ENDPOINTS ==========
    # Public endpoint to get event guide
    path('events/<int:event_id>/eventdesc/', views.EventGuideDetailAPIView.as_view(), name='event_guide_detail'),
    
    # Admin endpoint to create/update event guide
    path('events/<int:event_id>/eventdesc/admin/', views.EventGuideCreateUpdateAPIView.as_view(), name='event_guide_admin'),

    # Scan and mark attendance
    path('events/<int:event_id>/mark-attendance/' , views.Scanner.as_view() , name='attendance_qr'),
    
    # ========== EVENT QUESTIONS ENDPOINTS ==========
    # Manage event questions (Admin creates, users can view)
    path('events/<int:event_id>/questions/', views.EventQuestionsManageAPIView.as_view(), name='event_questions_manage'),
    
    # Individual question management (Admin only)
    path('events/questions/<int:question_id>/', views.EventQuestionDetailAPIView.as_view(), name='event_question_detail'),

    # Form responses endpoints (Admin only)
    path('events/<int:event_id>/form-responses/', views.EventFormResponsesAPIView.as_view(), name='event_form_responses'),
    path('events/<int:event_id>/participants/<int:participant_id>/form-response/', views.ParticipantFormResponseAPIView.as_view(), name='participant_form_response'),
    
    # ========== EVENT CATEGORY ENDPOINTS ==========
    # Public endpoint to get all categories
    path('events/categories/', views.EventCategoryListAPIView.as_view(), name='event_categories'),
    
    # Admin endpoints for category management
    path('events/categories/create/', views.EventCategoryCreateAPIView.as_view(), name='event_category_create'),
    path('events/categories/<int:category_id>/update/', views.EventCategoryUpdateAPIView.as_view(), name='event_category_update'),
    path('events/categories/<int:category_id>/delete/', views.EventCategoryDeleteAPIView.as_view(), name='event_category_delete'),
]
