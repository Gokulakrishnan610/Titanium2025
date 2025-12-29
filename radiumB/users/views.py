from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import api_view, permission_classes
from authentication.models import UserProfile
from .serializers import UserProfileSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class UserListView(APIView):
    """
    List all users - Admin only
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            users = User.objects.all().select_related('profile')
            user_data = []

            for user in users:
                profile_data = {}
                if hasattr(user, 'profile'):
                    profile_data = UserProfileSerializer(user.profile).data

                user_data.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'display_name': getattr(user.profile, 'display_name', '') if hasattr(user, 'profile') else '',
                    'is_eventStaff': getattr(user.profile, 'is_eventStaff', False) if hasattr(user, 'profile') else False,
                    'is_superuser': getattr(user.profile, 'is_superuser', False) if hasattr(user, 'profile') else False,
                    'is_qr_scanner': getattr(user.profile, 'is_qr_scanner', False) if hasattr(user, 'profile') else False,
                    'is_verified': getattr(user.profile, 'is_verified', False) if hasattr(user, 'profile') else False,
                })

            return Response(user_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to fetch users: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserRoleUpdateView(APIView):
    """
    Update user roles - Admin only
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)

            # Get the role and value from request
            role = request.data.get('role')
            value = request.data.get('value')

            if role not in ['is_qr_scanner']:
                return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)

            # Update the role on the user's profile
            if hasattr(user, 'profile'):
                setattr(user.profile, role, value)
                user.profile.save()

                return Response({
                    "message": f"User role updated successfully",
                    "user_id": user_id,
                    "role": role,
                    "value": value
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "User profile not found"}, status=status.HTTP_404_NOT_FOUND)

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Failed to update user role: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# from event.email_services import create_error_response, create_success_response
# from django.core.mail import send_mail
# from django.template.loader import render_to_string
# from django.conf import settings
# from django.utils import timezone

class UserProfileView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrive only authenticated user's profile"""
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        """Update user profile fully"""
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = UserProfileSerializer(profile, data=request.data, partial=False)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except UserProfile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
    def patch(self, request):
        """Partially update user profile"""
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except UserProfile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request):
        """Delete user profile"""
        try:
            profile = UserProfile.objects.get(user=request.user)
            profile.delete()
            return Response({"message": "Profile deleted"}, status=status.HTTP_204_NO_CONTENT)
        except UserProfile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
class UserProfileCompletionView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrive only authenticated user's profile"""
        try:
            profile = UserProfile.objects.get(user=request.user)
            completion_response = {"is_complete": profile.is_profile_complete, "missing_fields": self.get_missing_fields(profile=profile)}
            return Response(completion_response,     status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

    def get_missing_fields(self, profile):
        """Function returns list of incomplete required fields"""
        missing_fields = []
        if not profile.gender:
            missing_fields.append('gender')
        if not profile.degree:
            missing_fields.append('degree')
        if not profile.year:
            missing_fields.append('year')
        if not profile.department:
            missing_fields.append('department')
        if not profile.rollno:
            missing_fields.append('rollno')
        if not profile.phone_number:
            missing_fields.append('phone_number')
        if not profile.is_verified:
            missing_fields.append('is_verified')
        return missing_fields

# class SendVerificationOTPView(APIView):
#     """Send OTP for email verification"""
#     permission_classes = [IsAuthenticated]
    
#     def post(self, request):
#         user = request.user
        
#         if user.profile.is_verified:
#             return create_error_response("Email is already verified", 400)
        
#         otp_obj, created = EmailVerificationOTP.objects.get_or_create(
#             user=user,
#             defaults={
#                 'otp': '',
#                 'expires_at': timezone.now()
#             }
#         )
        
#         otp = otp_obj.generate_otp()
        
#         try:
#             subject = 'Verify Your Email - RadiumB'
#             html_message = render_to_string('otp/otp_template.html', {
#                 'user': user,
#                 'otp': otp
#             })
            
#             send_mail(
#                 subject=subject,
#                 message='',  
#                 html_message=html_message,
#                 from_email=settings.DEFAULT_FROM_EMAIL,
#                 recipient_list=[user.email],
#                 fail_silently=False,
#             )
            
#             return create_success_response("Verification OTP sent to your email")
            
#         except Exception as e:
#             return create_error_response(f"Failed to send OTP: {str(e)}", 500)

# class VerifyEmailOTPView(APIView):
#     """Verify email using OTP"""
#     permission_classes = [IsAuthenticated]
    
#     def post(self, request):
#         user = request.user
#         otp = request.data.get('otp')
        
#         if not otp:
#             return create_error_response("OTP is required", 400)
        
#         try:
#             otp_obj = user.email_verification
            
#             if otp_obj.verify_otp(otp):
            
#                 user.profile.is_verified = True
#                 user.profile.save()
                
#                 otp_obj.delete()
                
#                 return create_success_response("Email verified successfully")
#             else:
#                 return create_error_response("Invalid or expired OTP", 400)
                
#         except EmailVerificationOTP.DoesNotExist:
#             return create_error_response("No OTP found. Please request a new one.", 400)

from .membership.models import DevsMembership, PremiumMembershipSlot, PremiumMembershipApplication
from .serializers import (
    DevsMembershipSerializer, PremiumMembershipSlotSerializer, 
    PremiumMembershipApplicationSerializer, MembershipStatusSerializer,
    ClaimDevMembershipSerializer
)


class MembershipStatusView(APIView):
    """
    Get current membership status and available options for the authenticated user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return comprehensive membership status"""
        try:
            user = request.user
            
            # Check DEVS membership
            devs_membership = None
            has_devs_membership = False
            try:
                devs_membership = DevsMembership.objects.get(user=user)
                has_devs_membership = True
            except DevsMembership.DoesNotExist:
                pass
            
            # Check DEVS eligibility
            can_claim_devs, eligibility_message = DevsMembership.can_claim_membership(user)
            
            # Get premium applications
            premium_applications = PremiumMembershipApplication.objects.filter(user=user)
            
            # Get available premium slots
            available_premium_slots = PremiumMembershipSlot.objects.filter(
                is_open=True
            ).exclude(
                applications__user=user  # Exclude slots user has already applied to
            )
            
            # Define membership benefits
            membership_benefits = {
                'basic_devs': [
                    'Access to DEVS community',
                    'Participation in workshops',
                    'Networking opportunities',
                    'Basic project resources'
                ],
                'premium_devs': [
                    'All basic DEVS benefits',
                    'Priority event access',
                    'Advanced workshops',
                    'Mentorship programs',
                    'Exclusive project opportunities',
                    'Premium resource access'
                ]
            }
            
            # Prepare response data
            status_data = {
                'has_devs_membership': has_devs_membership,
                'devs_membership': DevsMembershipSerializer(devs_membership).data if devs_membership else None,
                'can_claim_devs': can_claim_devs,
                'devs_eligibility_message': eligibility_message,
                'premium_applications': PremiumMembershipApplicationSerializer(premium_applications, many=True).data,
                'available_premium_slots': PremiumMembershipSlotSerializer(available_premium_slots, many=True).data,
                'membership_benefits': membership_benefits
            }
            
            return Response(status_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch membership status: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ClaimDevMembershipView(APIView):
    """
    Claim DEVS membership for eligible first-year students
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Claim DEVS membership"""
        try:
            user = request.user
            
            # Validate input
            serializer = ClaimDevMembershipSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Check eligibility
            can_claim, message = DevsMembership.can_claim_membership(user)
            if not can_claim:
                return Response(
                    {"error": message}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create membership
            membership = DevsMembership.objects.create(
                user=user,
                membership_type='basic',
                status='active'
            )
            
            return Response({
                "message": "DEVS membership claimed successfully",
                "membership": DevsMembershipSerializer(membership).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"error": f"Failed to claim membership: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MembershipBenefitsView(APIView):
    """
    Get membership benefits information
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return membership benefits"""
        try:
            benefits = {
                'basic_devs': {
                    'title': 'Basic DEVS Membership',
                    'description': 'Perfect for first-year students starting their development journey',
                    'benefits': [
                        'Access to DEVS community Discord',
                        'Participation in beginner workshops',
                        'Networking with fellow developers',
                        'Basic project resources and templates',
                        'Monthly tech talks and seminars'
                    ],
                    'eligibility': 'First-year students only',
                    'cost': 'Free'
                },
                'premium_devs': {
                    'title': 'Premium DEVS Membership',
                    'description': 'Advanced membership for serious developers',
                    'benefits': [
                        'All basic DEVS benefits',
                        'Priority access to exclusive events',
                        'Advanced technical workshops',
                        'One-on-one mentorship programs',
                        'Exclusive internship opportunities',
                        'Premium development tools access',
                        'Project showcase opportunities',
                        'Industry expert sessions'
                    ],
                    'eligibility': 'Must have existing DEVS membership',
                    'cost': 'Application-based (limited slots)'
                }
            }
            
            return Response(benefits, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch benefits: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PremiumSlotsListView(APIView):
    """
    List available premium membership slots
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return available premium slots"""
        try:
            # Get currently open slots
            open_slots = PremiumMembershipSlot.objects.filter(is_open=True)
            
            # Get all slots for reference (admin view)
            all_slots = PremiumMembershipSlot.objects.all()
            
            response_data = {
                'open_slots': PremiumMembershipSlotSerializer(open_slots, many=True).data,
                'all_slots': PremiumMembershipSlotSerializer(all_slots, many=True).data if request.user.is_staff else []
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch premium slots: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ApplyForPremiumMembershipView(APIView):
    """
    Apply for premium membership slot
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Submit premium membership application"""
        try:
            user = request.user
            slot_id = request.data.get('slot')
            application_reason = request.data.get('application_reason')
            
            if not slot_id or not application_reason:
                return Response(
                    {"error": "Slot ID and application reason are required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user has DEVS membership
            try:
                devs_membership = DevsMembership.objects.get(user=user)
                if not devs_membership.is_active:
                    return Response(
                        {"error": "You must have an active DEVS membership to apply for premium"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except DevsMembership.DoesNotExist:
                return Response(
                    {"error": "You must have DEVS membership to apply for premium"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if slot exists and is open
            try:
                slot = PremiumMembershipSlot.objects.get(id=slot_id)
                if not slot.is_currently_open:
                    return Response(
                        {"error": "This premium slot is not currently open for applications"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except PremiumMembershipSlot.DoesNotExist:
                return Response(
                    {"error": "Premium slot not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user already applied to this slot
            existing_application = PremiumMembershipApplication.objects.filter(
                user=user, slot=slot
            ).first()
            
            if existing_application:
                return Response(
                    {"error": "You have already applied to this premium slot"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create application
            application = PremiumMembershipApplication.objects.create(
                user=user,
                slot=slot,
                application_reason=application_reason,
                status='pending'
            )
            
            return Response({
                "message": "Premium membership application submitted successfully",
                "application": PremiumMembershipApplicationSerializer(application).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"error": f"Failed to submit application: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ========== Dynamic Choices API Views ==========

from .dynamic_choices_models import Year, Department, Category

@api_view(['GET'])
@permission_classes([AllowAny])
def get_year_choices(request):
    """Get all active year choices"""
    years = Year.objects.filter(is_active=True).order_by('order')
    data = [{'code': year.code, 'display_name': year.display_name} for year in years]
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_department_choices(request):
    """Get all active department choices, optionally filtered by category"""
    category = request.query_params.get('category', None)
    
    if category:
        departments = Department.objects.filter(
            is_active=True, 
            category__code=category,
            category__is_active=True
        ).order_by('order')
    else:
        departments = Department.objects.filter(is_active=True).order_by('category__order', 'order')
    
    data = [{
        'code': dept.code,
        'full_name': dept.full_name,
        'category': dept.category.code
    } for dept in departments]
    
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_category_choices(request):
    """Get all active category choices"""
    categories = Category.objects.filter(is_active=True).order_by('order')
    
    data = [{
        'code': cat.code,
        'display_name': cat.display_name
    } for cat in categories]
    
    return Response(data, status=status.HTTP_200_OK)
