from django.db import models


class Notification(models.Model):
    topic = models.CharField(max_length=100, blank=True)
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'admin_notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.topic}] {self.title}'


def create_admin_notification(topic, title, body):
    notification = Notification.objects.create(topic=topic, title=title, body=body)
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        layer = get_channel_layer()
        async_to_sync(layer.group_send)('admin_notifications', {
            'type': 'admin.notification',
            'notification': {
                'id': notification.id,
                'topic': notification.topic,
                'title': notification.title,
                'body': notification.body,
                'created_at': notification.created_at.isoformat(),
            },
        })
    except Exception:
        pass
    return notification
