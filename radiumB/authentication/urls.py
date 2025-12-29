from dj_rest_auth.registration.views import RegisterView
from authentication.views import (
    # GoogleLogin, GithubLogin,
    # GoogleAuthURL, GitHubAuthURL,
    # google_callback, github_callback,
    # refresh_google_token, refresh_github_token,
    custom_login, refresh_token, CreateAdminUserAPIView
)
from dj_rest_auth.views import LogoutView, UserDetailsView, PasswordChangeView, PasswordResetView, PasswordResetConfirmView
from django.urls import path, re_path
from django.contrib.auth import views as auth_views

urlpatterns = [
    path("register/", RegisterView.as_view(), name="rest_register"),
    path("login/", custom_login, name="rest_login"),
    path("logout/", LogoutView.as_view(), name="rest_logout"),
    path("user/", UserDetailsView.as_view(), name="rest_user_details"),
    path("token/refresh/", refresh_token, name="token_refresh"),
    path("change-password/", PasswordChangeView.as_view(), name="Change password while authenticated"),
    path("reset-password/", PasswordResetView.as_view(), name="password_reset"),
    path("reset-password/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("create-admin/", CreateAdminUserAPIView.as_view(), name="create_admin"),
    # Password reset URLs for web interface
    path('password_reset/', auth_views.PasswordResetView.as_view(
        template_name='registration/password_reset_form.html',
        email_template_name='registration/password_reset_email.html',
        subject_template_name='registration/password_reset_subject.txt',
        success_url='/password_reset/done/'
    ), name='password_reset'),
    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(
        template_name='registration/password_reset_done.html'
    ), name='password_reset_done'),
    re_path(r'^reset/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$',
        auth_views.PasswordResetConfirmView.as_view(
            template_name='registration/password_reset_confirm.html',
            success_url='/reset/done/'
        ), name='django_password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetDoneView.as_view(
        template_name='registration/password_reset_complete.html'
    ), name='password_reset_complete'),
    # path('google/', GoogleLogin.as_view(), name="google_login"),
    # path('github/', GithubLogin.as_view(), name='github_login'),
    # path('google/auth-url/', GoogleAuthURL.as_view(), name="google_auth_url"),
    # path('github/auth-url/', GitHubAuthURL.as_view(), name="github_auth_url"),
    # path('google/callback/', google_callback, name='google_callback'),
    # path('github/callback/', github_callback, name='github_callback'),
    # path('google/refresh-token/', refresh_google_token, name='refresh_google_token'),
    # path('github/refresh-token/', refresh_github_token, name='refresh_github_token'),
]