from django.conf.urls import patterns, include, url
from django.contrib import admin
from adminplus.sites import AdminSitePlus
from reports.views import ReportView

admin.site = AdminSitePlus()
admin.autodiscover()
admin.site.site_header = 'Reports'

urlpatterns = patterns(
    '',
    url(r'console/', include(admin.site.urls)),
    url(r'api/v1/report/(?P<report_id>\d+)/', ReportView.as_view()),
)