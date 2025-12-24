from django.apps import AppConfig
from django.db.models.signals import post_save

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        from django.contrib.auth import get_user_model
        from authentication.models import UserProfile

        User = get_user_model()

        def create_user_profile(sender, instance, created, **kwargs):
            if created:
                UserProfile.objects.create(user=instance)
        post_save.connect(create_user_profile, sender=User)

