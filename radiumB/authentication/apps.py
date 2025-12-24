from django.apps import AppConfig


class AuthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authentication'

    def ready(self):
        # Monkey patch dj-rest-auth URL generator to prevent URL generation for REST API
        import dj_rest_auth.forms

        def dummy_url_generator(request, user, temp_key):
            """Dummy URL generator that returns None for REST API"""
            return None

        # Override the default URL generator
        dj_rest_auth.forms.default_url_generator = dummy_url_generator
