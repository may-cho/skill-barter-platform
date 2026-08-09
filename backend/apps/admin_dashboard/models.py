from django.conf import settings
from django.db import models


# ───────────────────────────── Admin Notifications ────────────────────────────

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


# ───────────────────────────── User Notifications ─────────────────────────────

class UserNotificationType(models.TextChoices):
    PROPOSAL_RECEIVED = 'proposal_received', 'Proposal Received'
    COUNTER_OFFER = 'counter_offer', 'Counter Offer'
    PROPOSAL_ACCEPTED = 'proposal_accepted', 'Proposal Accepted'
    PROPOSAL_CANCELLED = 'proposal_cancelled', 'Proposal Cancelled'
    REVIEW_RECEIVED = 'review_received', 'Review Received'


class UserNotification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    type = models.CharField(
        max_length=30,
        choices=UserNotificationType.choices,
        default=UserNotificationType.PROPOSAL_RECEIVED,
    )
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.type}] {self.title} → {self.recipient}'


def create_user_notification(recipient, notif_type, title, body=''):
    """Create a persisted user notification and push it via WebSocket."""
    notif = UserNotification.objects.create(
        recipient=recipient,
        type=notif_type,
        title=title,
        body=body,
    )
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        layer = get_channel_layer()
        group = f'user_{recipient.id}'
        async_to_sync(layer.group_send)(group, {
            'type': 'user.notification',
            'notification': {
                'id': notif.id,
                'type': notif.type,
                'title': notif.title,
                'body': notif.body,
                'is_read': notif.is_read,
                'created_at': notif.created_at.isoformat(),
            },
        })
    except Exception:
        pass
    return notif
