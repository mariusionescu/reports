# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ApiKey',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('key', models.CharField(max_length=64)),
                ('user', models.ForeignKey(help_text=b'The user who is associated with the API key.', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'API Key',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Report',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(default=b'', help_text=b'Report name.', max_length=64)),
                ('hdf_file', models.FilePathField(help_text=b'HDF file name where data is stored', path=b'/var/tmp', match=b'*.hdf')),
                ('key', models.ForeignKey(help_text=b'The key authorised for this report', to='reports.ApiKey')),
                ('user', models.ForeignKey(help_text=b'The user associated with the report', to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
