from dj_rest_auth.serializers import PasswordResetSerializer, PasswordResetConfirmSerializer
from dj_rest_auth.registration.serializers import RegisterSerializer
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from authentication.forms import CustomPasswordResetForm
from rest_framework import serializers

User = get_user_model()

class CustomPasswordResetConfirmSerializer(serializers.Serializer):
    """Custom password reset confirm serializer that properly handles base64 uid"""

    uid = serializers.CharField()
    token = serializers.CharField()
    new_password1 = serializers.CharField(write_only=True)
    new_password2 = serializers.CharField(write_only=True)

    def validate_uid(self, value):
        try:
            # URL decode first in case it was encoded
            import urllib.parse
            decoded_value = urllib.parse.unquote(value)
            
            # Decode the base64 uid to get the user ID
            uid_str = force_str(urlsafe_base64_decode(decoded_value))
            
            # Try to convert to int, but handle string PKs too
            try:
                uid = int(uid_str)
            except ValueError:
                uid = uid_str
            
            # Get the user
            user = User.objects.get(pk=uid)
            return user
        except Exception as e:
            raise serializers.ValidationError('Invalid uid')

    def validate(self, attrs):
        try:
            uid = attrs.get('uid')  # This is now the User object from validate_uid
            token = attrs.get('token')
            new_password1 = attrs.get('new_password1')
            new_password2 = attrs.get('new_password2')

            # URL decode token in case it was encoded
            import urllib.parse
            token = urllib.parse.unquote(token)

            if not all([uid, token, new_password1, new_password2]):
                raise serializers.ValidationError('All fields are required')

            if new_password1 != new_password2:
                raise serializers.ValidationError('Passwords do not match')

            # uid is already validated and converted to User object by validate_uid
            user = uid

            # Validate token
            if not default_token_generator.check_token(user, token):
                raise serializers.ValidationError('Invalid token')

            attrs['user'] = user
            return attrs
        except serializers.ValidationError:
            raise
        except Exception as e:
            raise serializers.ValidationError('Invalid reset link')

    def save(self):
        user = self.validated_data['user']
        new_password = self.validated_data['new_password1']
        user.set_password(new_password)
        user.save()
        return user

class CustomPasswordResetSerializer(PasswordResetSerializer):
    """Custom password reset serializer that doesn't generate URLs"""

    def save(self):
        request = self.context.get('request')
        email = self.data.get('email')
        form = CustomPasswordResetForm(data={'email': email})
        if form.is_valid():
            form.save(
                use_https=request.is_secure() if request else False,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL'),
                request=request,
                token_generator=default_token_generator,
                domain_override=getattr(settings, 'SITE_DOMAIN', 'localhost:3000'),
            )

class CustomRegisterSerializer(RegisterSerializer):
    """Custom registration serializer that validates email uniqueness and saves names"""
    
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    
    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def save(self, request):
        """Override save to set first_name and last_name"""
        user = super().save(request)
        user.first_name = self.validated_data.get('first_name', '')
        user.last_name = self.validated_data.get('last_name', '')
        user.save()
        return user