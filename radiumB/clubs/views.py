from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Club, ClubMembership, ClubSettings
from .serializers import (
    ClubSerializer, ClubListSerializer, ClubMembershipSerializer,
    ClubSettingsSerializer, UserClubsSerializer
)

User = get_user_model()


class IsStaffOrClubAdmin(permissions.BasePermission):
    """
    Custom permission to only allow Django staff users or club admins to access club management.
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Allow Django staff users (those with admin access)
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # For non-staff users, check if they have club admin permissions
        if view.action in ['list', 'retrieve', 'my_clubs']:
            # Allow viewing for users who are admins of at least one club
            return ClubMembership.objects.filter(
                user=request.user,
                role='admin',
                status='active'
            ).exists()
        
        # For create, update, delete actions, require staff access
        if view.action in ['create', 'update', 'partial_update', 'destroy']:
            return False
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Django staff users have full access
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Club admins can only access their own clubs
        if isinstance(obj, Club):
            return ClubMembership.objects.filter(
                user=request.user,
                club=obj,
                role='admin',
                status='active'
            ).exists()
        
        return False


class ClubViewSet(viewsets.ModelViewSet):
    """ViewSet for managing clubs - restricted to Django staff users"""
    
    queryset = Club.objects.all()
    permission_classes = [IsStaffOrClubAdmin]
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ClubListSerializer
        return ClubSerializer
    
    def get_queryset(self):
        queryset = Club.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by club type
        club_type = self.request.query_params.get('type', None)
        if club_type:
            queryset = queryset.filter(club_type=club_type)
        
        # Search by name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset.order_by('name')
    
    @action(detail=True, methods=['get'])
    def events(self, request, slug=None):
        """Get events for a specific club"""
        club = self.get_object()
        events = club.events.filter(is_active=True).order_by('-event_date')
        
        # Import here to avoid circular imports
        from event.serializers import EventSerializer
        serializer = EventSerializer(events, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def members(self, request, slug=None):
        """Get members for a specific club"""
        club = self.get_object()
        memberships = club.memberships.filter(status='active').order_by('-joined_at')
        serializer = ClubMembershipSerializer(memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def check_admin_access(self, request):
        """Check if current user has admin access to club management"""
        has_access = (
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.is_superuser or
             ClubMembership.objects.filter(
                 user=request.user,
                 role='admin',
                 status='active'
             ).exists())
        )
        
        return Response({
            'has_access': has_access,
            'is_staff': request.user.is_staff if request.user.is_authenticated else False,
            'is_superuser': request.user.is_superuser if request.user.is_authenticated else False,
            'club_admin_count': ClubMembership.objects.filter(
                user=request.user,
                role='admin',
                status='active'
            ).count() if request.user.is_authenticated else 0
        })

    @action(detail=False, methods=['get'])
    def my_clubs(self, request):
        """Get clubs the current user belongs to - only for staff users or club admins"""
        if not (request.user.is_staff or request.user.is_superuser):
            # For non-staff users, only show clubs where they are admins
            memberships = ClubMembership.objects.filter(
                user=request.user,
                status='active',
                role='admin'
            ).select_related('club')
        else:
            # Staff users can see all their memberships
            memberships = ClubMembership.objects.filter(
                user=request.user,
                status='active'
            ).select_related('club')
        
        serializer = UserClubsSerializer(memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def join(self, request, slug=None):
        """Join a club - restricted to staff users"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Only Django admin users can join clubs through this interface'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        club = self.get_object()
        
        # Check if user is already a member
        existing_membership = ClubMembership.objects.filter(
            club=club,
            user=request.user
        ).first()
        
        if existing_membership:
            if existing_membership.status == 'active':
                return Response(
                    {'error': 'You are already a member of this club'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # Reactivate membership
                existing_membership.status = 'active'
                existing_membership.save()
                serializer = ClubMembershipSerializer(existing_membership)
                return Response(serializer.data)
        
        # Create new membership with admin role for staff users
        membership = ClubMembership.objects.create(
            club=club,
            user=request.user,
            role='admin',  # Staff users get admin role by default
            status='active'
        )
        
        serializer = ClubMembershipSerializer(membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def leave(self, request, slug=None):
        """Leave a club"""
        club = self.get_object()
        
        try:
            membership = ClubMembership.objects.get(
                club=club,
                user=request.user,
                status='active'
            )
            membership.status = 'inactive'
            membership.save()
            return Response({'message': 'Successfully left the club'})
        except ClubMembership.DoesNotExist:
            return Response(
                {'error': 'You are not a member of this club'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ClubMembershipViewSet(viewsets.ModelViewSet):
    """ViewSet for managing club memberships - restricted to Django staff users"""
    
    queryset = ClubMembership.objects.all()
    serializer_class = ClubMembershipSerializer
    permission_classes = [IsAdminUser]  # Only Django admin users
    
    def get_queryset(self):
        queryset = ClubMembership.objects.select_related('club', 'user')
        
        # Filter by club
        club_id = self.request.query_params.get('club', None)
        if club_id:
            queryset = queryset.filter(club_id=club_id)
        
        # Filter by user
        user_id = self.request.query_params.get('user', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-joined_at')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending membership"""
        membership = self.get_object()
        
        if membership.status != 'pending':
            return Response(
                {'error': 'Membership is not pending approval'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        membership.status = 'active'
        membership.save()
        
        serializer = self.get_serializer(membership)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a pending membership"""
        membership = self.get_object()
        
        if membership.status != 'pending':
            return Response(
                {'error': 'Membership is not pending approval'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        membership.delete()
        return Response({'message': 'Membership request rejected'})


class ClubSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet for managing club settings - restricted to Django staff users"""
    
    queryset = ClubSettings.objects.all()
    serializer_class = ClubSettingsSerializer
    permission_classes = [IsAdminUser]  # Only Django admin users
    
    def get_queryset(self):
        queryset = ClubSettings.objects.select_related('club')
        
        # Filter by club
        club_id = self.request.query_params.get('club', None)
        if club_id:
            queryset = queryset.filter(club_id=club_id)
        
        return queryset