from django.conf.urls import patterns, include, url
from django.contrib import admin
from adminplus.sites import AdminSitePlus
from reports.views import ReportView
from django.views.generic import RedirectView

admin.site = AdminSitePlus()
admin.autodiscover()
admin.site.site_header = 'Reports'

urlpatterns = patterns(
    '',
    url(r'^$', RedirectView.as_view(url='/static/site/index.html')),
    url(r'console/', include(admin.site.urls)),
    url(r'api/v1/report/(?P<report_id>\d+)/', ReportView.as_view()),
)