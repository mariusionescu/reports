from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
import pandas
import os
from datetime import datetime, timedelta


class ApiKey(models.Model):
    class Meta:
        app_label = 'reports'
        verbose_name = 'API Key'

    key = models.CharField(max_length=64, null=False)
    user = models.ForeignKey(User, null=False, help_text="The user who is associated with the API key.")

    def __unicode__(self):
        return self.key


class Report(models.Model):
    class Meta:
        app_label = 'reports'

    KEY = 'kpi'

    key = models.ForeignKey('ApiKey', null=False, help_text="The key authorised for this report")
    user = models.ForeignKey(User, null=False, help_text="The user associated with the report")
    name = models.CharField(max_length=64, null=False, blank=False, default='', help_text="Report name.")
    hdf_file = models.FilePathField(
        path=settings.HDF_PATH, match='*.hdf',
        help_text="HDF file name where data is stored"
    )

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None):

        if not self.id:
            super(Report, self).save(
                force_insert=False, force_update=False, using=None,
                update_fields=None
            )
        self.hdf_file = '%s/report_%s_%s.hdf' % (settings.HDF_PATH, self.user.id, self.id)
        super(Report, self).save(
            force_insert=False, force_update=False, using=None,
            update_fields=None
        )

    def append(self, rows, index=None, timestamp=None):
        """
        rows parameter has the following format:
        rows = [
            {'count': 10L, 'object_repr': 'Safari', 'content_type_id': 21L},
            {'count': 4L, 'object_repr': 'Romania', 'content_type_id': 19L},
            {'count': 12L, 'object_repr': 'Marius Ionescu', 'content_type_id': 18L},
            {'count': 8L, 'object_repr': 'KeyZone', 'content_type_id': 17L},
            {'count': 1L, 'object_repr': 'Top 728x90', 'content_type_id': 14L},
            {'count': 1L, 'object_repr': 'foo.bar', 'content_type_id': 12L},
        ]
        :param rows:
        :return:
        """

        if not timestamp:
            timestamp = datetime.utcnow()

        if index:
            dataframe = pandas.DataFrame(rows, index=[r[index] for r in rows])
        else:
            dataframe = pandas.DataFrame(rows)
        panel = pandas.Panel.from_dict({timestamp: dataframe}, orient='minor')
        panel.to_hdf(self.hdf_file, self.KEY, format='table', append=True)

    def purge(self):
        if os.path.exists(self.hdf_file):
            os.remove(self.hdf_file)

    def read(self, aggregation=None, start_date=None, end_date=None):
        """
        :param aggregation: {'column_1': 'sum', 'column_2': 'means'}
        :param start_date:
        :param end_date:
        :return:
        """
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=7)
        if not end_date:
            end_date = datetime.utcnow()

        panel = pandas.read_hdf(
            self.hdf_file,
            self.KEY,
            where=[
                'minor_axis>"%s"' % start_date,
                'minor_axis<"%s"' % end_date,
            ]
        )

        if aggregation:
            tables = []
            table = []

            for column in panel.keys():
                a = aggregation.get(column, 'max')
                table.append({column: dict(getattr(panel[column], a)(1))})
                print list(getattr(panel[column], a)(1))

            timestamp = (panel.minor_axis.max().to_pydatetime() - datetime(1970, 1, 1)).total_seconds()

            tables.append({timestamp: self.normalize_table(table)})

            return tables
        else:
            tables = []
            for key in panel.minor_axis:
                minor_data = panel.minor_xs(key)
                table = []

                for index, row in minor_data.dropna().iterrows():
                    _row = {}

                    for column in minor_data.keys():

                        if row[column]:
                            _row[column] = row[column]

                    table.append(_row)

                timestamp = (key.to_pydatetime() - datetime(1970, 1, 1)).total_seconds()

                tables.append({timestamp: table})

            return tables


    @staticmethod
    def normalize_table(table):
        normalized_table = {}
        for data_set in table:
            for column, line in data_set.items():
                for key, value in line.items():
                    l = normalized_table.get(key, {})
                    l[column] = value
                    normalized_table[key] = l

        return normalized_table.values()

    def __unicode__(self):
        return self.name