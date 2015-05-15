from django.http import HttpResponse
from django.views.generic import View
from reports.models import Report
from django.views.decorators.csrf import csrf_exempt
import json
from datetime import datetime
import collections
from django.shortcuts import render, render_to_response


class JSONRequest(object):
    def __init__(self):
        self.raw = None

    def to_dict(self):
        dictionary = json.loads(self.raw)
        return self.convert(dictionary)

    def to_str(self):
        return self.raw

    @staticmethod
    def from_request(request):
        json_request = JSONRequest()
        json_request.raw = request.read() or request.GET.keys()[0]
        return json_request

    @staticmethod
    def from_dict(dictionary):
        json_request = JSONRequest()
        json_request.raw = json.dumps(dictionary)
        return json_request

    def to_http(self):
        response = HttpResponse(self.raw, content_type='application/json')
        response['Access-Control-Allow-Origin'] = '*'
        return response

    def convert(self, data):
        if isinstance(data, basestring):
            return str(data)
        elif isinstance(data, collections.Mapping):
            return dict(map(self.convert, data.iteritems()))
        elif isinstance(data, collections.Iterable):
            return type(data)(map(self.convert, data))
        else:
            return data


class GoogleChart(object):
    def __init__(self, data):
        self.data = data

    def to_http(self):
        return HttpResponse(self.data, content_type='application/javascript')


class ImageChart(object):
    def __init__(self, data):
        self.data = data

    def to_http(self):
        return HttpResponse(self.data, content_type='image/png')


class InvalidKey(Exception):
    pass


class InvalidPayload(Exception):
    pass


class ReportView(View):

    def __init__(self, **kwargs):
        super(ReportView, self).__init__(**kwargs)
        self.report = None
        self.data = None
        self.request = None

    def init(self, request, report_id):

        self.request = JSONRequest.from_request(request)
        try:
            self.data = self.request.to_dict()
        except ValueError:
            raise InvalidPayload

        api_key = self.data.get('key')

        try:
            self.report = Report.objects.get(id=report_id, key__key=api_key)
        except Report.DoesNotExist:
            raise InvalidKey

    def put(self, request, report_id):
        try:
            self.init(request, report_id)
        except InvalidKey:
            response = JSONRequest.from_dict({'success': False, 'error': 'INVALID_KEY'})
            return response.to_http()
        except InvalidPayload:
            response = JSONRequest.from_dict({'success': False, 'error': 'INVALID_PAYLOAD'})
            return response.to_http()

        rows = self.data['rows']
        if type(rows) is not list:
            rows = [rows]
        index = self.data.get('index')
        unix_time = self.data.get('timestamp')
        if unix_time:
            timestamp = datetime.fromtimestamp(unix_time)
            print timestamp
        else:
            timestamp = None

        try:
            self.report.append(rows, index, timestamp)
            response = JSONRequest.from_dict({'success': True})
        except ValueError as e:
            response = JSONRequest.from_dict({'success': False, 'error': 'INVALID_SCHEMA', 'message': e.message})
        return response.to_http()

    def post(self, request, report_id):
        try:
            self.init(request, report_id)
        except InvalidKey:
            response = JSONRequest.from_dict({'success': False, 'error': 'INVALID_KEY'})
            return response.to_http()
        except InvalidPayload:
            response = JSONRequest.from_dict({'success': False, 'error': 'INVALID_PAYLOAD'})
            return response.to_http()
        aggregation = self.data.get('aggregation', {})
        start_unix_time = self.data.get('start_date')
        output = self.data.get('output', 'json')
        if start_unix_time:
            start_date = datetime.fromtimestamp(start_unix_time)
        else:
            start_date = None

        end_unix_time = self.data.get('end_date')
        if end_unix_time:
            end_date = datetime.fromtimestamp(end_unix_time)
        else:
            end_date = None

        print start_date
        print end_date
        try:
            data = self.report.read(aggregation, start_date, end_date)
        except KeyError as e:
            json_request = JSONRequest.from_dict({
                'success': False,
                'error': 'EMPTY_DB',
                'message': e.message
            })
            return json_request.to_http()
        if output == 'json':
            json_request = JSONRequest.from_dict({
                'success': True,
                'data': data['tables'],
                'start_date': data['start_date'],
                'end_date': data['end_date']
            })
            return json_request.to_http()
        elif output == 'javascript':
            chart = GoogleChart(data)
            return chart.to_http()
        elif output == 'png':
            chart = ImageChart(data)
            return chart.to_http()
        else:
            json_request = JSONRequest.from_dict({
                'success': False,
                'error': 'FORMAT_NOT_SUPPORTED'
            })
            return json_request.to_http()

    def delete(self, request, report_id):
        try:
            self.init(request, report_id)
        except InvalidKey:
            response = JSONRequest.from_dict({'success': False, 'error': 'INVALID_KEY'})
            return response.to_http()
        except InvalidPayload:
            response = JSONRequest.from_dict({'success': False, 'error': 'INVALID_PAYLOAD'})
            return response.to_http()

        self.report.purge()

        response = JSONRequest.from_dict({'success': True})
        return response.to_http()

    def get(self, request, report_id):
        return render_to_response('get.html', {'report_id': report_id})