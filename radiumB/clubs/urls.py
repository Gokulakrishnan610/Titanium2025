from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClubViewSet, ClubMembershipViewSet, ClubSettingsViewSet

router = DefaultRouter()
router.register(r'clubs', ClubViewSet)
router.register(r'memberships', ClubMembershipViewSet)
router.register(r'settings', ClubSettingsViewSet)

app_name = 'clubs'

urlpatterns = [
    path('api/', include(router.urls)),
]