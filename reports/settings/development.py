from reports.settings.defaults import *


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'reports_dev',
        'USER': 'root',
        'PASSWORD': '',
        'HOST': 'localhost',
        'PORT': '',
    }
}

LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.request': {
            'handlers': ['console'],
            'propagate': True,
            'level': 'DEBUG',
        },
        '': {
            'level': 'DEBUG',
            'handlers': ['console'],
            'propagate': False
        }
    },
}

APP_URL = 'http://reports'