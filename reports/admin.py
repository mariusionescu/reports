from django.contrib import admin
from reports.models import ApiKey, Report

import string
import random


def id_generator(size=6, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))


class ApiKeyAdmin(admin.ModelAdmin):

    list_display = ('key',)

    readonly_fields = ('key', 'user', 'show_help')

    fieldsets_new = (
        ('General', {
            'classes': (),
            'fields': ('show_help',)
        }),
    )

    fieldsets_existing = (
        ('General', {
            'classes': (),
            'fields': ('key',)
        }),
    )

    def get_fieldsets(self, requests, obj=None):
        if obj:
            return self.fieldsets_existing
        else:
            return self.fieldsets_new

    def show_help(self, obj):
        if obj.id:
            text = ''
        else:
            text = "Please press <strong>Save</strong> in order to create a new API key."
        return text
    show_help.short_description = "Help"
    show_help.allow_tags = True

    def save_model(self, request, obj, form, change):
        if not obj.id:
            obj.user = request.user
            obj.key = id_generator(16)
        obj.save()

admin.site.register(ApiKey, ApiKeyAdmin)


def reset(modeladmin, request, queryset):
    for report in queryset.all():
        report.purge()
reset.short_description = "Reset the selected reports"


class ReportAdmin(admin.ModelAdmin):

    list_display = ('name',)

    readonly_fields = ('user', 'hdf_file')

    fieldsets = (
        ('General', {
            'classes': (),
            'fields': ('name', 'key')
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.id:
            obj.user = request.user
        obj.save()

    actions = [reset]

admin.site.register(Report, ReportAdmin)
