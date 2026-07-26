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
