import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings') # Set environment variable to the settings module

celery = Celery('app')
celery.config_from_object('django.conf:settings', namespace='CELERY') # Specify where celery can find configuration variables
celery.autodiscover_tasks()


"""
for celery and redis run following commands:


- run redis in docker:
```
docker run -d -p 6379:6379 redis
```

- run celery worker (does not work in windows - for windows run in wsl - but I belive redis container must be run in the wsl as well OR use port forwarding)
```
celery -A app worker --loglevel=info
```




"""