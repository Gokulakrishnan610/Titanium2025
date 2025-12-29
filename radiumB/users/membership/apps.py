from django.apps import AppConfig


class MembershipConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users.membership'
    label = 'membership'
    verbose_name = 'Membership Management'
