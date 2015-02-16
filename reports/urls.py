from django.conf.urls import patterns, include, url
from django.contrib import admin
from adminplus.sites import AdminSitePlus

admin.site = AdminSitePlus()
admin.autodiscover()
admin.site.site_header = 'Reports'

urlpatterns = patterns(
    '',
    url(r'', include(admin.site.urls)),
)