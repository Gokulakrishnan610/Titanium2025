from django.contrib import admin
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from import_export.admin import ImportExportModelAdmin
from import_export import resources


class GroupResource(resources.ModelResource):
    """Resource for importing/exporting Group data"""
    class Meta:
        model = Group
        fields = ('id', 'name')
        export_order = fields


class PermissionResource(resources.ModelResource):
    """Resource for importing/exporting Permission data"""
    class Meta:
        model = Permission
        fields = ('id', 'name', 'content_type__app_label', 'content_type__model', 'codename')
        export_order = fields


class ContentTypeResource(resources.ModelResource):
    """Resource for importing/exporting ContentType data"""
    class Meta:
        model = ContentType
        fields = ('id', 'app_label', 'model')
        export_order = fields


# Unregister and re-register Group with import/export
admin.site.unregister(Group)


@admin.register(Group)
class GroupAdmin(ImportExportModelAdmin):
    resource_class = GroupResource
    list_display = ('name',)
    search_fields = ('name',)
    filter_horizontal = ('permissions',)


@admin.register(Permission)
class PermissionAdmin(ImportExportModelAdmin):
    resource_class = PermissionResource
    list_display = ('name', 'content_type', 'codename')
    list_filter = ('content_type__app_label',)
    search_fields = ('name', 'codename')


@admin.register(ContentType)
class ContentTypeAdmin(ImportExportModelAdmin):
    resource_class = ContentTypeResource
    list_display = ('app_label', 'model')
    list_filter = ('app_label',)
    search_fields = ('app_label', 'model')
