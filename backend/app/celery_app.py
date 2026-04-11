from celery import Celery
import os


def make_celery(app=None):
    celery = Celery(
        'logguard',
        broker=os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
        backend=os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
        include=['app.tasks']
    )

    celery.conf.update(
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        timezone='UTC',
        enable_utc=True,
        task_routes={
            'app.tasks.send_email_task': {'queue': 'email'},
            'app.tasks.send_whatsapp_task': {'queue': 'whatsapp'},
            'app.tasks.generate_report_task': {'queue': 'reports'},
        }
    )

    if app is not None:
        class ContextTask(celery.Task):
            def __call__(self, *args, **kwargs):
                with app.app_context():
                    return self.run(*args, **kwargs)
        celery.Task = ContextTask

    return celery


celery = make_celery()
