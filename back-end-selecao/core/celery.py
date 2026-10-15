from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# Configure periodic tasks (Celery Beat)
app.conf.beat_schedule = {
    # Atualiza status dos processos a cada 30 minutos
    'update-selection-process-status': {
        'task': 'selection.tasks.update_selection_process_status',
        'schedule': 1800.0,  # A cada 30 minutos (em segundos)
    },
    # Notifica quando processos entram em análise
    'notify-process-analysis': {
        'task': 'selection.tasks.notify_process_entered_analysis',
        'schedule': crontab(hour=9, minute=0),  # Todos os dias às 9h
    },
}

# Configurações do Celery
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Sao_Paulo',
    enable_utc=False,
    worker_max_tasks_per_child=100,
    worker_prefetch_multiplier=1,
    task_default_queue='celery',
    task_create_missing_queues=True,
    task_routes={
        'selection.tasks.send_password_reset_sms': {'queue': 'sms'},
    },
)

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')