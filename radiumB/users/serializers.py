from rest_framework import serializers
from authentication.models import UserProfile
from .membership.models import DevsMembership, PremiumMembershipSlot, PremiumMembershipApplication
from .dynamic_choices_models import Year, Department
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    department_display = serializers.ReadOnlyField()
    # is_eventStaff = serializers.BooleanField(source='user.is_eventStaff', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'display_name', 'gender', 'degree', 'year', 'year_display', 'department', 'department_display', 'rollno',
            'phone_number', 'college_name', 'profile_picture',
            'is_profile_complete', 'date_of_birth', 'bio',
            'created_at', 'updated_at', 'is_verified', 'is_eventStaff','is_superuser'
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_profile_complete', 'year_display', 'department_display']
        


class DevsMembershipSerializer(serializers.ModelSerializer):
    """Serializer for DEVS membership"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    membership_type_display = serializers.CharField(source='get_membership_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    is_premium = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = DevsMembership
        fields = [
            'id', 'user_username', 'membership_type', 'membership_type_display',
            'status', 'status_display', 'claimed_at', 'expires_at', 
            'premium_upgraded_at', 'is_active', 'is_premium'
        ]
        read_only_fields = [
            'id', 'claimed_at', 'expires_at', 'premium_upgraded_at',
            'is_active', 'is_premium'
        ]


class PremiumMembershipSlotSerializer(serializers.ModelSerializer):
    """Serializer for premium membership slots"""
    allocated_slots = serializers.IntegerField(read_only=True)
    available_slots = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    is_currently_open = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = PremiumMembershipSlot
        fields = [
            'id', 'name', 'description', 'total_slots', 'allocated_slots',
            'available_slots', 'is_open', 'is_full', 'is_currently_open',
            'opens_at', 'closes_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'allocated_slots', 'available_slots', 'is_full',
            'is_currently_open', 'created_at', 'updated_at'
        ]


class PremiumMembershipApplicationSerializer(serializers.ModelSerializer):
    """Serializer for premium membership applications"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    slot_name = serializers.CharField(source='slot.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True)
    
    class Meta:
        model = PremiumMembershipApplication
        fields = [
            'id', 'user_username', 'slot', 'slot_name', 'status', 'status_display',
            'application_reason', 'applied_at', 'reviewed_at', 
            'reviewed_by_username', 'review_notes'
        ]
        read_only_fields = [
            'id', 'applied_at', 'reviewed_at', 'reviewed_by_username'
        ]


class MembershipStatusSerializer(serializers.Serializer):
    """Serializer for membership status response"""
    has_devs_membership = serializers.BooleanField()
    devs_membership = DevsMembershipSerializer(allow_null=True)
    can_claim_devs = serializers.BooleanField()
    devs_eligibility_message = serializers.CharField()
    premium_applications = PremiumMembershipApplicationSerializer(many=True)
    available_premium_slots = PremiumMembershipSlotSerializer(many=True)
    membership_benefits = serializers.DictField()


class ClaimDevMembershipSerializer(serializers.Serializer):
    """Serializer for claiming DEVS membership"""
    # No input fields needed - eligibility is checked server-side
    pass