from django.urls import path
from .views import (
    UserProfileView, UserProfileCompletionView, UserListView, UserRoleUpdateView,
    MembershipStatusView, ClaimDevMembershipView, MembershipBenefitsView, PremiumSlotsListView,
    ApplyForPremiumMembershipView, get_year_choices, get_department_choices, get_category_choices
)


urlpatterns = [
    # User profile endpoints
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile/completion/', UserProfileCompletionView.as_view(), name='profile_completion'),
    path('list/', UserListView.as_view(), name='user_list'),
    path('<int:user_id>/role/', UserRoleUpdateView.as_view(), name='user_role_update'),
    
    # Membership endpoints
    path('membership/status/', MembershipStatusView.as_view(), name='membership_status'),
    path('membership/claim-dev/', ClaimDevMembershipView.as_view(), name='claim_dev_membership'),
    path('membership/benefits/', MembershipBenefitsView.as_view(), name='membership_benefits'),
    path('membership/premium-slots/', PremiumSlotsListView.as_view(), name='premium_slots_list'),
    path('membership/apply-premium/', ApplyForPremiumMembershipView.as_view(), name='apply_premium_membership'),
    
    # path('verify/send-otp/', SendVerificationOTPView.as_view(), name='send_verification_otp'),
    # path('verify/confirm/', VerifyEmailOTPView.as_view(), name='verify_email_otp'),
    
    # Dynamic choices endpoints
    path('choices/years/', get_year_choices, name='year_choices'),
    path('choices/categories/', get_category_choices, name='category_choices'),
    path('choices/departments/', get_department_choices, name='department_choices'),
]
