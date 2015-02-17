from django.http import HttpResponse
from django.views.generic import View
from reports.models import Report
from django.views.decorators.csrf import csrf_exempt
import json


class JSONRequest(object):
    def __init__(self):
        self.raw = None

    def to_dict(self):
        return json.loads(self.raw)

    def to_str(self):
        return self.raw

    @staticmethod
    def from_request(request):
        json_request = JSONRequest()
        json_request.raw = request.read()
        return json_request

    @staticmethod
    def from_dict(dictionary):
        json_request = JSONRequest()
        json_request.raw = json.dumps(dictionary)
        return json_request

    def to_http(self):
        return HttpResponse(self.raw, content_type='application/json')


class ReportView(View):

    def post(self, request, report_id):
        report = Report.objects.get(pk=report_id)

        payload = JSONRequest.from_request(request)

        print payload.to_dict()

        response = JSONRequest.from_dict({'success': True, "id": report_id})
        return response.to_http()

    def put(self, request, report_id):
        print request.read()
        return HttpResponse('PUT')

    def delete(self, request, report_id):
        print request.POST
        return HttpResponse('DELETE')

