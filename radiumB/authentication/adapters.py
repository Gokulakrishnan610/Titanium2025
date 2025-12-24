from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth.models import User
from django.db import transaction
from django.shortcuts import redirect
import requests
import re

class SocialAccountAdapter(DefaultSocialAccountAdapter):
    
    def save_user(self, request, sociallogin, form=None):
        """Save user and handle profile picture fetching"""
        with transaction.atomic():
            # Save the user first (this handles username/email automatically)
            user = super().save_user(request, sociallogin, form)
            
            # Imported here to avoid circular imports
            from authentication.models import UserProfile
            
            # Get or create user profile
            profile, created = UserProfile.objects.get_or_create(user=user)

            profile.email = user.email

            gender = sociallogin.account.extra_data.get("gender")
            if gender:
                profile.gender = gender

            profile.save(update_fields=['email','gender'])
            # Extract and save profile picture URL based on provider
            self.update_profile_picture(profile, sociallogin)
            
            return user
    
    def populate_username(self, request, user):
        """
        Override username population to handle social login usernames properly
        """
        # Get the sociallogin from request if available
        sociallogin = getattr(request, 'sociallogin', None)
        
        if sociallogin:
            provider = sociallogin.account.provider
            extra_data = sociallogin.account.extra_data
            
            # Extract username based on provider
            if provider == 'google':
                # Google doesn't provide username, use email prefix
                email = extra_data.get('email') or user.email
                if email:
                    username = email.split('@')[0]
                else:
                    username = extra_data.get('name', '').replace(' ', '').lower()
            elif provider == 'github':
                # GitHub provides 'login' field as username
                username = extra_data.get('login') or extra_data.get('name', '').replace(' ', '').lower()
            else:
                username = extra_data.get('username') or extra_data.get('name', '').replace(' ', '').lower()
            
            # Clean the username (remove special characters, make lowercase)
            username = re.sub(r'[^a-zA-Z0-9_]', '', username).lower()
            
            # Ensure username is not empty
            if not username:
                username = f"user_{sociallogin.account.uid}"
            
            # Make username unique if it already exists
            original_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{original_username}_{counter}"
                counter += 1
            
            user.username = username
        
        return super().populate_username(request, user)
    
    def update_profile_picture(self, profile, sociallogin):
        """Extract profile picture URL from social login data and update profile"""
        try:
            provider = sociallogin.account.provider
            extra_data = sociallogin.account.extra_data
            
            picture_url = None
            
            if provider == 'google':
                # Google stores profile picture in 'picture' field
                picture_url = extra_data.get('picture')
            elif provider == 'github':
                # GitHub stores avatar in 'avatar_url' field
                picture_url = extra_data.get('avatar_url')
            
            if picture_url:
                # Just store the URL, don't download the image
                profile.update_social_profile_picture(picture_url)
        except Exception as e:
            # Log error but don't fail the entire login process
            print(f"Error updating profile picture for user {profile.user.username}: {e}")
            # Could also use logging here:
            # import logging
            # logger = logging.getLogger(__name__)
            # logger.error(f"Error updating profile picture for user {profile.user.username}: {e}")
    
    def pre_social_login(self, request, sociallogin):
        """Handle pre-login logic including email verification and profile picture updates"""
        # Check if the email already exists in the social login's extra data
        email = sociallogin.account.extra_data.get('email')

        # Get the username for fallback email generation
        username = sociallogin.account.extra_data.get('login')

        # If email doesn't exist in the extra data, try different approaches
        if not email:
            try:
                # First try: Get email from GitHub API
                social_token = sociallogin.account.socialtoken_set.first()
                if social_token:
                    email = self.fetch_email_from_github(social_token.token)
                    
                    # Second try: If API doesn't return email, use GitHub's noreply address
                    if not email and username:
                        # GitHub provides no-reply emails in the format: {id}+{username}@users.noreply.github.com
                        # or newer format: {username}@users.noreply.github.com
                        user_id = sociallogin.account.extra_data.get('id')
                        if user_id:
                            email = f"{user_id}+{username}@users.noreply.github.com"
                        else:
                            email = f"{username}@users.noreply.github.com"
            except Exception as e:
                print(f"Error accessing GitHub data: {str(e)}")
                
            # Store the email if we found one
            if email:
                sociallogin.account.extra_data['email'] = email
        
        # If email is available (either original or generated)
        if email:
            try:
                # Check if a user already exists with this email
                user = User.objects.get(email=email)
                # If a user exists, link the social account to the existing user
                sociallogin.user = user
                
                # Update profile picture for existing user (in case it changed on social platform)
                from authentication.models import UserProfile
                try:
                    profile = user.userprofile
                    self.update_profile_picture(profile, sociallogin)
                except UserProfile.DoesNotExist:
                    # Profile will be created in save_user
                    pass
                    
            except User.DoesNotExist:
                # If no user exists, the user will be created and linked
                pass
        else:
            # Last resort: Allow user to provide an email manually
            # Store details in session and redirect to a custom form
            if request and hasattr(request, 'session'):
                request.session['socialaccount_sociallogin'] = sociallogin.serialize()
                return redirect('custom_email_input')  # You'll need to create this view
            
            # If redirect not possible, raise error
            raise ValueError("Could not obtain or generate email for GitHub account")

        return super().pre_social_login(request, sociallogin)
       
    def fetch_email_from_github(self, token):
        """Fetch user email from GitHub API"""
        url = 'https://api.github.com/user/emails'
        headers = {
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        try:
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                emails = response.json()
                
                # Try to get any verified email (primary preferred)
                primary_verified = next((e['email'] for e in emails if e.get('verified') and e.get('primary')), None)
                if primary_verified:
                    return primary_verified
                    
                # Fall back to any verified email
                any_verified = next((e['email'] for e in emails if e.get('verified')), None)
                if any_verified:
                    return any_verified
                    
                # Last resort: any email at all
                any_email = next((e['email'] for e in emails if 'email' in e), None)
                return any_email
                
            return None
        except Exception as e:
            print(f"Error in GitHub API request: {str(e)}")
            return None