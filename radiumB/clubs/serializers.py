from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Club, ClubMembership, ClubSettings

User = get_user_model()


class ClubSerializer(serializers.ModelSerializer):
    """Serializer for Club model"""
    
    total_events = serializers.ReadOnlyField()
    total_members = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    
    class Meta:
        model = Club
        fields = [
            'id', 'name', 'slug', 'description', 'club_type', 'email', 'phone', 'website',
            'logo', 'banner', 'primary_color', 'secondary_color', 'status', 'is_default',
            'allow_public_events', 'require_approval', 'payment_gateway',
            'total_events', 'total_members', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'total_events', 'total_members', 'is_active']


class ClubListSerializer(serializers.ModelSerializer):
    """Simplified serializer for club listings"""
    
    total_events = serializers.ReadOnlyField()
    total_members = serializers.ReadOnlyField()
    
    class Meta:
        model = Club
        fields = [
            'id', 'name', 'slug', 'club_type', 'logo', 'primary_color',
            'status', 'total_events', 'total_members'
        ]


class ClubMembershipSerializer(serializers.ModelSerializer):
    """Serializer for ClubMembership model"""
    
    user_details = serializers.SerializerMethodField()
    club_name = serializers.CharField(source='club.name', read_only=True)
    
    class Meta:
        model = ClubMembership
        fields = [
            'id', 'club', 'club_name', 'user', 'user_details', 'role', 'status',
            'can_create_events', 'can_manage_members', 'can_manage_payments', 'can_view_analytics',
            'joined_at', 'updated_at'
        ]
        read_only_fields = ['joined_at', 'updated_at']
    
    def get_user_details(self, obj):
        """Get user details for the membership"""
        user = obj.user
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.get_full_name() or user.username,
        }


class ClubSettingsSerializer(serializers.ModelSerializer):
    """Serializer for ClubSettings model"""
    
    class Meta:
        model = ClubSettings
        fields = [
            'id', 'club', 'email_signature', 'notification_emails',
            'default_event_duration', 'auto_approve_events', 'max_events_per_month',
            'default_registration_deadline_days', 'allow_late_registration',
            'default_currency', 'payment_terms', 'social_links', 'custom_fields',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class UserClubsSerializer(serializers.ModelSerializer):
    """Serializer to show clubs a user belongs to"""
    
    club = ClubListSerializer(read_only=True)
    
    class Meta:
        model = ClubMembership
        fields = ['club', 'role', 'status', 'joined_at']