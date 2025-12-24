from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth import get_user_model
from django.utils.translation import gettext as _
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

User = get_user_model()

class CustomPasswordResetForm(PasswordResetForm):
    """Custom password reset form that works with REST API"""

    def save(self, domain_override=None, subject_template_name=None,
             email_template_name=None, use_https=False, token_generator=None,
             from_email=None, request=None, html_email_template_name=None,
             extra_email_context=None):
        """
        Override save method to work with REST API without URL generation
        """
        # Get users for the provided email
        email = self.cleaned_data["email"]
        if not email:
            return

        # Get active users with this email
        active_users = User.objects.filter(
            email__iexact=email,
            is_active=True
        )

        for user in active_users:
            # Generate token
            if token_generator is None:
                from django.contrib.auth.tokens import default_token_generator
                token_generator = default_token_generator

            token = token_generator.make_token(user)

            # Send email using Django's email system
            from django.core.mail import send_mail
            from django.template.loader import render_to_string
            from django.conf import settings

            context = {
                'email': user.email,
                'domain': domain_override or getattr(settings, 'SITE_DOMAIN', 'localhost:3000'),
                'site_name': getattr(settings, 'SITE_NAME', 'RadiumB'),
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'user': user,
                'token': token,
                'protocol': 'https' if use_https else 'http',
            }

            # Debug output
            print(f"DEBUG: domain_override={domain_override}")
            print(f"DEBUG: SITE_DOMAIN={getattr(settings, 'SITE_DOMAIN', 'NOT_SET')}")
            print(f"DEBUG: context domain={context['domain']}")
            print(f"DEBUG: uid={context['uid']}, token={context['token'][:10]}...")

            if extra_email_context:
                context.update(extra_email_context)

            # Render email templates
            subject = render_to_string(subject_template_name or 'registration/password_reset_subject.txt', context).strip()
            html_message = render_to_string(html_email_template_name or 'registration/password_reset_email.html', context)
            plain_message = render_to_string(email_template_name or 'registration/password_reset_email.txt', context)

            # Send email
            send_mail(
                subject,
                plain_message,
                from_email or settings.DEFAULT_FROM_EMAIL,
                [user.email],
                html_message=html_message,
                fail_silently=False,
            )