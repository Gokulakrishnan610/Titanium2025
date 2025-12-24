from datetime import timedelta
from django.contrib.auth import get_user_model
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from allauth.socialaccount.models import SocialAccount
from rest_framework.authtoken.models import Token
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
import requests
import logging
import os
import secrets
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from rest_framework_simplejwt.exceptions import TokenError
import hashlib
from django.http import JsonResponse
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)
User = get_user_model()

def generate_oauth_state(request):
    """Generate a secure state parameter and store it in the session"""
    state = secrets.token_urlsafe(32)
    request.session['state'] = state
    request.session.save()
    print(f"Session Key: {request.session.session_key}")
    print(f"State stored in session: {request.session.get('state')}")
    print(f"Session Cookies: {request.COOKIES}")
    print(f"Session Data: {request.session.items()}")


    return state

class CustomGoogleOAuth2Client(OAuth2Client):
    def __init__(
        self,
        request,
        consumer_key,
        consumer_secret,
        access_token_method,
        access_token_url,
        callback_url,
        _scope,  
        scope_delimiter=" ",
        headers=None,
        basic_auth=False,
    ):
        super().__init__(
            request,
            consumer_key,
            consumer_secret,
            access_token_method,
            access_token_url,
            callback_url,
            scope_delimiter,
            headers,
            basic_auth,
        )



class CustomGitHubOAuth2Client(OAuth2Client):
    def __init__(
        self,
        request,
        consumer_key,
        consumer_secret,
        access_token_method,
        access_token_url,
        callback_url,
        _scope,  
        scope_delimiter=" ",
        headers=None,
        basic_auth=False,
    ):
        super().__init__(
            request,
            consumer_key,
            consumer_secret,
            access_token_method,
            access_token_url,
            callback_url,
            scope_delimiter,
            headers,
            basic_auth,
        )


def get_or_create_social_app(provider):
    """Helper function to get or create a social app with environment variables"""
    try:
        return SocialApp.objects.get(provider=provider)
    except SocialApp.DoesNotExist:
        
        if provider == 'google':
            client_id = os.environ.get('GOOGLE_CLIENT_ID', getattr(settings, 'GOOGLE_CLIENT_ID', ''))
            secret = os.environ.get('GOOGLE_CLIENT_SECRET', getattr(settings, 'GOOGLE_CLIENT_SECRET', ''))
            name = 'Google OAuth'
        elif provider == 'github':
            client_id = os.environ.get('GITHUB_CLIENT_ID', getattr(settings, 'GITHUB_CLIENT_ID', ''))
            secret = os.environ.get('GITHUB_CLIENT_SECRET', getattr(settings, 'GITHUB_CLIENT_SECRET', ''))
            name = 'GitHub OAuth'
        else:
            raise ValueError(f"Unsupported provider: {provider}")
        
        
        if not client_id or not secret:
            raise ValueError(f"Missing {provider} OAuth credentials. Set them in environment variables or settings.")
        
        
        social_app = SocialApp.objects.create(
            provider=provider,
            name=name,
            client_id=client_id,
            secret=secret
        )
        
        
        site = Site.objects.get_current()
        social_app.sites.add(site)
        
        return social_app


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:5173/auth/callback"
    client_class = CustomGoogleOAuth2Client


class GithubLogin(SocialLoginView):
    adapter_class = GitHubOAuth2Adapter
    callback_url = "http://localhost:5173/auth/callback"
    client_class = CustomGitHubOAuth2Client



class GoogleAuthURL(APIView):
    def get(self, request):
        try:
            
            try:
                social_app = get_or_create_social_app('google')
                client_id = social_app.client_id
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            state = generate_oauth_state(request)
            
            return Response({
                'authorization_url': f"https://accounts.google.com/o/oauth2/v2/auth"
                                    f"?client_id={client_id}"
                                    f"&redirect_uri=http://localhost:5173/auth/callback"
                                    f"&response_type=code"
                                    f"&scope=email%20profile%20openid"
                                    f"&state={state}"
                                    f"&access_type=offline"
                                    f"&prompt=consent"
                                    
            })
        except Exception as e:
            logger.exception("Error generating Google auth URL")
            return Response({"error": str(e)}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GitHubAuthURL(APIView):
    def get(self, request):
        try:
            try:
                social_app = get_or_create_social_app('github')
                client_id = social_app.client_id
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            state = generate_oauth_state(request)

            return Response({
                'authorization_url': f"https://github.com/login/oauth/authorize"
                                    f"?client_id={client_id}"
                                    f"&redirect_uri=http://localhost:5173/auth/callback"
                                    f"&scope=user:email%20read:user"
                                    f"&access_type=offline" 
                                    f"&prompt=consent"
                                    f"&state={state}"
            })
        except Exception as e:
            logger.exception("Error generating GitHub auth URL")
            return Response({"error": str(e)}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from rest_framework.decorators import api_view, throttle_classes
from rest_framework.throttling import AnonRateThrottle
import re
from urllib.parse import urlparse

class AuthRateThrottle(AnonRateThrottle):
    rate = '10/min'  # Limit to 10 requests per minute

def validate_oauth_code(code):
    """Validate OAuth authorization code format"""
    if not code or not isinstance(code, str):
        return False
    # OAuth codes are typically alphanumeric with some special chars
    if not re.match(r'^[a-zA-Z0-9\-._~%/+=]+$', code):
        return False
    if len(code) < 3 or len(code) > 512:  # More reasonable length bounds
        return False
    return True

def validate_state_parameter(state):
    """Validate state parameter format"""
    if not state or not isinstance(state, str):
        return False
    # State should be a secure random string
    if not re.match(r'^[a-zA-Z0-9\-_]+$', state):
        return False
    if len(state) < 8 or len(state) > 128:  # More reasonable length bounds
        return False
    return True

def sanitize_user_data(user_info):
    """Sanitize user data from OAuth providers"""
    if not isinstance(user_info, dict):
        return {}
    
    # Define allowed fields and their max lengths
    allowed_fields = {
        'email': 254,  # Django's email field max length
        'given_name': 30,
        'family_name': 30,
        'name': 60,
        'login': 150,  # Django username max length
        'id': 50,
        'picture': 500,
        'avatar_url': 500
    }
    
    sanitized = {}
    for field, max_length in allowed_fields.items():
        if field in user_info:
            value = str(user_info[field])[:max_length]  # Truncate if too long
            # Basic HTML/script tag removal
            value = re.sub(r'<[^>]*>', '', value)
            sanitized[field] = value
    
    return sanitized

@api_view(['POST'])
@throttle_classes([AuthRateThrottle])
def google_callback(request):
    # Input validation
    code = request.data.get('code')
    state = request.data.get('state')

    # Validate input parameters
    if not validate_oauth_code(code):
        return Response({"error": "Invalid authorization code format"}, status=status.HTTP_400_BAD_REQUEST)
    
    if not validate_state_parameter(state):
        return Response({"error": "Invalid state parameter format"}, status=status.HTTP_400_BAD_REQUEST)

    # Verify CSRF state parameter
    session_state = request.session.get('state')
    if not session_state or session_state != state:
        return Response({"error": "Invalid state parameter"}, status=status.HTTP_400_BAD_REQUEST)
    request.session.pop('state', None)  # Consume state token
    

    try:
        
        try:
            social_app = get_or_create_social_app('google')
            client_id = social_app.client_id
            client_secret = social_app.secret
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
        token_url = 'https://oauth2.googleapis.com/token'
        payload = {
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': "http://localhost:5173/auth/callback",
            'grant_type': 'authorization_code'
        }
        
        response = requests.post(token_url, data=payload)
        token_data = response.json()
        print(token_data)
        
        if 'error' in token_data:
            logger.error(f"Google OAuth error: {token_data}")
            return Response({"error": token_data['error']}, status=status.HTTP_400_BAD_REQUEST)
            
        
        access_token = token_data.get('access_token')
        refresh_token = token_data.get('refresh_token')
        expires_in = token_data.get('expires_in', 3600)

        user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        headers = {'Authorization': f'Bearer {access_token}'}
        user_info_response = requests.get(user_info_url, headers=headers)
        
        if user_info_response.status_code != 200:
            return Response({"error": "Failed to fetch user info from Google"}, status=status.HTTP_400_BAD_REQUEST)
        
        user_info = user_info_response.json()
        user_info = sanitize_user_data(user_info)

        email = user_info.get('email')
        if not email:
            return Response({"error": "Email not provided by Google"}, status=status.HTTP_400_BAD_REQUEST)

        # --- Restrict to @rajalakshmi.edu.in domain ---
        if not email.lower().endswith('@rajalakshmi.edu.in'):
            return Response(
                {"error": "Only REC STUDENTS are allowed."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        with transaction.atomic():
            
            email = user_info.get('email')
            if not email:
                return Response({"error": "Email not provided by Google"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                
                user = User.objects.get(email=email)
                logger.info(f"Found existing user: {user.username}")
            except User.DoesNotExist:
                
                username = email.split('@')[0]  
                
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=user_info.get('given_name', ''),
                    last_name=user_info.get('family_name', '')
                )
                user.set_unusable_password()  
                user.save()
                logger.info(f"Created new user: {user.username}")
            
            # Ensure UserProfile exists and update profile picture
            from authentication.models import UserProfile
            profile, profile_created = UserProfile.objects.get_or_create(user=user)
            
            # Update social profile picture if available
            picture_url = user_info.get('picture')
            if picture_url:
                profile.update_social_profile_picture(picture_url)
            
            # Create social account
            social_id = user_info.get('id')
            social_account, created = SocialAccount.objects.get_or_create(
                provider='google',
                uid=social_id,
                defaults={
                    'user': user,
                    'extra_data': user_info
                }
            )
            
            if not created and social_account.user != user:
                
                return Response(
                    {"error": "This Google account is already linked to another user"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            
            if not created:
                social_account.extra_data = user_info
                social_account.save()
            
            from django.utils import timezone
            from authentication.models import OAuthToken
            
            expires_at = timezone.now() + timezone.timedelta(seconds=expires_in)
            
            oauth_token, _ = OAuthToken.objects.update_or_create(
                user=user,
                provider='google',
                defaults={
                    'access_token': access_token,
                    'refresh_token': refresh_token if refresh_token else None,
                    'expires_at': expires_at,
                }
            )

            from rest_framework.authtoken.models import Token
            token, _ = Token.objects.get_or_create(user=user)
            refresh = RefreshToken.for_user(user)

            response = JsonResponse({
                "message": "Authentication successful",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "google_data": user_info
                }
            })
            response.set_cookie(
                key='access_token',
                value=str(refresh.access_token),
                httponly=True,
                secure=True,
                samesite='Strict',
                max_age=3600
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=True,
                samesite='Strict',
                max_age=3600 * 24 * 7  # 7 days
            )

            return response

        
    except RequestException as e:
        logger.error(f"Google API request failed: {str(e)}")
        return Response({"error": "Failed to communicate with Google"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except ValueError as e:
        logger.error(f"Value error: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.exception(f"Unexpected error in Google callback: {str(e)}")
        return Response({"error": "An unexpected error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@throttle_classes([AuthRateThrottle])
def github_callback(request):
    """Exchange authorization code for tokens."""
    code = request.data.get('code')
    state = request.data.get('state')

    # Validate input parameters
    if not validate_oauth_code(code):
        return Response({"error": "Invalid authorization code format"}, status=status.HTTP_400_BAD_REQUEST)
    
    if not validate_state_parameter(state):
        return Response({"error": "Invalid state parameter format"}, status=status.HTTP_400_BAD_REQUEST)

    # Verify CSRF state parameter
    session_state = request.session.get('state')
    if not session_state or session_state != state:
        return Response({"error": "Invalid state parameter"}, status=status.HTTP_400_BAD_REQUEST)
    request.session.pop('state', None)  # Consume state token
    
    try:
        
        try:
            social_app = get_or_create_social_app('github')
            client_id = social_app.client_id
            client_secret = social_app.secret
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
        token_url = 'https://github.com/login/oauth/access_token'
        payload = {
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': "http://localhost:5173/auth/callback"
        }
        headers = {'Accept': 'application/json'}
        
        response = requests.post(token_url, data=payload, headers=headers)
        token_data = response.json()
        print(token_data)

        
        if 'error' in token_data:
            logger.error(f"GitHub OAuth error: {token_data}")
            return Response({"error": token_data['error']}, status=status.HTTP_400_BAD_REQUEST)
            
        
        access_token = token_data.get('access_token')
        refresh_token = token_data.get('refresh_token')
        expires_in = token_data.get('expires_in', 28800)
        user_info_url = 'https://api.github.com/user'
        headers = {'Authorization': f'token {access_token}'}
        user_info_response = requests.get(user_info_url, headers=headers)
        
        if user_info_response.status_code != 200:
            return Response({"error": "Failed to fetch user info from GitHub"}, status=status.HTTP_400_BAD_REQUEST)
        
        user_info = user_info_response.json()
        # Sanitize user data from OAuth provider
        user_info = sanitize_user_data(user_info)
        
        # Handle email for GitHub (often private)
        if 'email' not in user_info or not user_info['email']:
            email_url = 'https://api.github.com/user/emails'
            emails_response = requests.get(email_url, headers=headers)
            
            if emails_response.status_code == 200:
                emails = emails_response.json()
                # Try to get primary email first, then any verified email
                primary_email = None
                for email_obj in emails:
                    if email_obj.get('primary') and email_obj.get('verified'):
                        primary_email = email_obj['email']
                        break
                
                # Fallback to any verified email
                if not primary_email:
                    for email_obj in emails:
                        if email_obj.get('verified'):
                            primary_email = email_obj['email']
                            break
                
                if primary_email:
                    user_info['email'] = primary_email
        
        
        with transaction.atomic():
            
            email = user_info.get('email')
            if not email:
                return Response({"error": "Email not provided by GitHub"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                
                user = User.objects.get(email=email)
                logger.info(f"Found existing user: {user.username}")
            except User.DoesNotExist:
                
                
                username = user_info.get('login') or email.split('@')[0]
                
                
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=user_info.get('name', '').split(' ')[0] if user_info.get('name') else '',
                    last_name=' '.join(user_info.get('name', '').split(' ')[1:]) if user_info.get('name') else ''
                )
                user.set_unusable_password()  
                user.save()
                logger.info(f"Created new user: {user.username}")
            
            # Ensure UserProfile exists and update profile picture
            from authentication.models import UserProfile
            profile, profile_created = UserProfile.objects.get_or_create(user=user)
            
            # Update social profile picture if available
            avatar_url = user_info.get('avatar_url')
            if avatar_url:
                profile.update_social_profile_picture(avatar_url)
            
            # Create social account
            social_id = str(user_info.get('id'))
            social_account, created = SocialAccount.objects.get_or_create(
                provider='github',
                uid=social_id,
                defaults={
                    'user': user,
                    'extra_data': user_info
                }
            )
            
            if not created and social_account.user != user:
                
                return Response(
                    {"error": "This GitHub account is already linked to another user"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            
            if not created:
                social_account.extra_data = user_info
                social_account.save()
            
            from django.utils import timezone
            from authentication.models import OAuthToken
            
            expires_at = timezone.now() + timezone.timedelta(seconds=expires_in) if expires_in else None
            
            oauth_token, _ = OAuthToken.objects.update_or_create(
                user=user,
                provider='github',
                defaults={
                    'access_token': access_token,
                    'refresh_token': refresh_token if refresh_token else None,
                    'expires_at': expires_at,
                }
            )

            from rest_framework.authtoken.models import Token
            token, _ = Token.objects.get_or_create(user=user)

            refresh = RefreshToken.for_user(user)
            response = JsonResponse({
                "message": "Authentication successful",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "github_data": user_info
                },
            })
            response.set_cookie(
                key='access_token',
                value=str(refresh.access_token),
                httponly=True,
                secure=True,
                samesite='Strict',
                max_age=3600
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=True,
                samesite='Strict',
                max_age=3600 * 24 * 7  # 7 days
            )

            return response
        
    except Exception as e:
        logger.exception(f"Error in GitHub callback: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['POST'])
def refresh_google_token(request):
    """Refresh Google access token using refresh token."""
    refresh_token = request.data.get('refresh_token')
    if not refresh_token:
        return Response({"error": "No refresh token provided"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Find the user by refresh token
        from authentication.models import OAuthToken
        oauth_token = OAuthToken.objects.get(refresh_token=refresh_token, provider='google')

        # Get Google OAuth credentials
        social_app = get_or_create_social_app('google')
        client_id = social_app.client_id
        client_secret = social_app.secret

        # Exchange refresh token for new access token
        token_url = 'https://oauth2.googleapis.com/token'
        payload = {
            'client_id': client_id,
            'client_secret': client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        }

        response = requests.post(token_url, data=payload)
        token_data = response.json()

        if 'error' in token_data:
            logger.error(f"Google token refresh error: {token_data}")
            return Response({"error": token_data.get('error_description', token_data['error'])}, 
                            status=status.HTTP_400_BAD_REQUEST)

        # Update stored tokens
        access_token = token_data.get('access_token')
        new_refresh_token = token_data.get('refresh_token', refresh_token)  # Use old if not provided
        expires_in = token_data.get('expires_in', 3600)

        expires_at = timezone.now() + timezone.timedelta(seconds=expires_in)
        oauth_token.access_token = access_token
        oauth_token.refresh_token = new_refresh_token
        oauth_token.expires_at = expires_at
        oauth_token.save()

        # Return the new tokens
        response = JsonResponse({
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "expires_at": expires_at.timestamp()
        })

        # Set tokens in secure cookies
        response.set_cookie(
            key='access_token',
            value=access_token,
            httponly=True,
            secure=True,
            samesite='Strict',
            max_age=3600
        )
        response.set_cookie(
            key='refresh_token',
            value=new_refresh_token,
            httponly=True,
            secure=True,
            samesite='Strict',
            max_age=3600 * 24 * 7  # 7 days
        )

        return response

    except OAuthToken.DoesNotExist:
        return Response({"error": "Invalid refresh token"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.exception(f"Error refreshing Google token: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def refresh_github_token(request):
    """Refresh GitHub access token using refresh token."""
    refresh_token = request.data.get('refresh_token')
    if not refresh_token:
        return Response({"error": "No refresh token provided"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Find the user by refresh token
        from authentication.models import OAuthToken
        oauth_token = OAuthToken.objects.get(refresh_token=refresh_token, provider='github')

        # Get GitHub OAuth credentials
        social_app = get_or_create_social_app('github')
        client_id = social_app.client_id
        client_secret = social_app.secret

        # Exchange refresh token for new access token
        token_url = 'https://github.com/login/oauth/access_token'
        payload = {
            'client_id': client_id,
            'client_secret': client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        }
        headers = {'Accept': 'application/json'}

        response = requests.post(token_url, data=payload, headers=headers)
        token_data = response.json()

        if 'error' in token_data:
            logger.error(f"GitHub token refresh error: {token_data}")
            return Response({"error": token_data.get('error_description', token_data['error'])}, 
                            status=status.HTTP_400_BAD_REQUEST)

        # Update stored tokens
        access_token = token_data.get('access_token')
        new_refresh_token = token_data.get('refresh_token', refresh_token)  # Use old if not provided
        expires_in = token_data.get('expires_in', 3600)

        expires_at = timezone.now() + timezone.timedelta(seconds=expires_in)
        oauth_token.access_token = access_token
        oauth_token.refresh_token = new_refresh_token
        oauth_token.expires_at = expires_at
        oauth_token.save()

        # Return the new tokens
        response = JsonResponse({
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "expires_at": expires_at.timestamp()
        })

        # Set tokens in secure cookies
        response.set_cookie(
            key='access_token',
            value=access_token,
            httponly=True,
            secure=True,
            samesite='Strict',
            max_age=3600
        )
        response.set_cookie(
            key='refresh_token',
            value=new_refresh_token,
            httponly=True,
            secure=True,
            samesite='Strict',
            max_age=3600 * 24 * 7  # 7 days
        )

        return response

    except OAuthToken.DoesNotExist:
        return Response({"error": "Invalid refresh token"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.exception(f"Error refreshing GitHub token: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def custom_login(request):
    """
    Custom login view that returns both JWT refresh token and regular token
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not password:
        return Response(
            {"error": "Password is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    if not (username or email):
        return Response(
            {"error": "Username or email is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Try to authenticate with username
        if username:
            user = authenticate(username=username, password=password)
        # If username not provided or authentication failed, try with email
        if not user and email:
            try:
                username = User.objects.get(email=email).username
                user = authenticate(username=username, password=password)
            except User.DoesNotExist:
                user = None
        
        if not user:
            return Response(
                {"error": "Invalid credentials"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Get or create regular token
        token, _ = Token.objects.get_or_create(user=user)
        
        # Calculate expiry for access token
        access_token_lifetime = settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME', timedelta(minutes=30))
        access_token_expiry = timezone.now() + access_token_lifetime
        
        # Update user's last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        return Response({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name
            },
            "token": token.key,
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
            "token_type": "Bearer",
            "expires_at": access_token_expiry.timestamp()
        })
    
    except Exception as e:
        logger.exception(f"Login error: {str(e)}")
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['POST'])
def refresh_token(request):
    """
    Refresh JWT access token using refresh token for regular login.
    """
    refresh_token = request.data.get('refresh_token')
    if not refresh_token:
        return Response(
            {"error": "No refresh token provided"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Validate and refresh the token
        refresh = RefreshToken(refresh_token)

        # Blacklist the old refresh token
        try:
            BlacklistedToken.objects.create(token=refresh)
        except Exception as e:
            logger.warning(f"Failed to blacklist token: {str(e)}")

        # Generate a new refresh token
        new_refresh = RefreshToken.for_user(refresh.user)

        # Generate a new access token
        access_token = str(new_refresh.access_token)

        # Calculate expiry for the new access token
        access_token_lifetime = settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME', timedelta(minutes=30))
        expires_at = timezone.now() + access_token_lifetime

        # Return the new tokens and expiry information
        response = JsonResponse({
            "access_token": access_token,
            "refresh_token": str(new_refresh),
            "token_type": "Bearer",
            "expires_at": expires_at.timestamp()
        })

        # Set tokens in secure cookies
        response.set_cookie(
            key='access_token',
            value=access_token,
            httponly=True,
            secure=True,
            samesite='Strict',
            max_age=3600
        )
        response.set_cookie(
            key='refresh_token',
            value=str(new_refresh),
            httponly=True,
            secure=True,
            samesite='Strict',
            max_age=3600 * 24 * 7  # 7 days
        )

        return response

    except TokenError as e:
        logger.warning(f"Invalid refresh token: {str(e)}")
        return Response(
            {"error": f"Invalid refresh token: {str(e)}"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        logger.exception(f"Error refreshing token: {str(e)}")
        return Response(
            {"error": "An error occurred while refreshing the token."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )