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

    class Media:
        css = {
            'all': ('/static/css/modal.css',)
        }

        js = (
            '//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js?ver=1.8.3',
            '//cdnjs.cloudflare.com/ajax/libs/simplemodal/1.4.4/jquery.simplemodal.min.js',
            '/static/js/modal.js'
        )

    list_display = ('name', 'as_table')

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

    def as_table(self, obj):
        iframe = '/static/examples/as_json.html?report_id=%s&report_key=%s' % (obj.id, obj.key)
        return """<a href="javascript: openModal('%s');">view</a>""" % iframe

    as_table.short_description = 'As table'
    as_table.allow_tags = True

    actions = [reset]

admin.site.register(Report, ReportAdmin)
