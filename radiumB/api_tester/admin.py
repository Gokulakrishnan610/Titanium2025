from django.contrib import admin
from django.urls import path
from django.shortcuts import render
from django.urls import get_resolver
from django.contrib.admin.views.decorators import staff_member_required
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
import re


class APITesterAdmin(admin.ModelAdmin):
    """Custom admin to display API endpoints"""

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


def get_all_api_endpoints():
    """Extract all API endpoints from URL patterns"""
    urlconf = get_resolver()
    endpoints = []

    def extract_endpoints(patterns, prefix=""):
        for pattern in patterns:
            if hasattr(pattern, "url_patterns"):
                # This is an included URLconf
                new_prefix = prefix + str(pattern.pattern)
                extract_endpoints(pattern.url_patterns, new_prefix)
            else:
                # This is a URL pattern
                path_str = prefix + str(pattern.pattern)
                # Clean up the path
                path_str = path_str.replace("^", "").replace("$", "")

                # Convert Django URL parameters to a more readable format
                # <int:pk> -> {pk} (integer)
                # <str:slug> -> {slug} (string)
                path_str = re.sub(r"<int:(\w+)>", r"{\1}", path_str)
                path_str = re.sub(r"<str:(\w+)>", r"{\1}", path_str)
                path_str = re.sub(r"<slug:(\w+)>", r"{\1}", path_str)
                path_str = re.sub(r"<uuid:(\w+)>", r"{\1}", path_str)
                path_str = re.sub(r"<path:(\w+)>", r"{\1}", path_str)

                # Only include API endpoints
                if path_str.startswith("api/"):
                    # Get HTTP methods
                    methods = []
                    if hasattr(pattern.callback, "cls"):
                        # Class-based view
                        view_class = pattern.callback.cls
                        if hasattr(view_class, "http_method_names"):
                            methods = [
                                m.upper()
                                for m in view_class.http_method_names
                                if m != "options" and hasattr(view_class, m)
                            ]
                    elif hasattr(pattern.callback, "actions"):
                        # ViewSet
                        methods = list(pattern.callback.actions.values())
                    else:
                        # Function-based view
                        methods = ["GET", "POST", "PUT", "PATCH", "DELETE"]

                    # Get view name
                    view_name = ""
                    if hasattr(pattern.callback, "cls"):
                        view_name = pattern.callback.cls.__name__
                    elif hasattr(pattern.callback, "__name__"):
                        view_name = pattern.callback.__name__

                    # Check if path has parameters
                    has_params = "{" in path_str

                    endpoints.append(
                        {
                            "path": "/" + path_str,
                            "name": pattern.name or view_name,
                            "methods": methods if methods else ["GET"],
                            "has_params": has_params,
                        }
                    )

    extract_endpoints(urlconf.url_patterns)
    return endpoints


@staff_member_required
def api_tester_view(request):
    """View to display all API endpoints"""
    endpoints = get_all_api_endpoints()

    # Group endpoints by app
    grouped_endpoints = {}
    for endpoint in endpoints:
        # Extract app name from path
        parts = endpoint["path"].split("/")
        if len(parts) > 2:
            app_name = parts[2]  # api/[app_name]/...
        else:
            app_name = "general"

        if app_name not in grouped_endpoints:
            grouped_endpoints[app_name] = []
        grouped_endpoints[app_name].append(endpoint)

    context = {
        
        "grouped_endpoints": grouped_endpoints,
        "site_header": admin.site.site_header,
        "site_title": admin.site.site_title,
    }

    return render(request, "admin/api_tester.html", context)


# Register a custom admin site extension
class APITesterAdminSite(admin.AdminSite):
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path("api-tester/", self.admin_view(api_tester_view), name="api_tester"),
        ]
        return custom_urls + urls
