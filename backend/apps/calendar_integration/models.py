from django.conf import settings
from django.db import models

class GoogleCalendarToken(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='google_calendar_token'
    )
    access_token = models.TextField()
    refresh_token = models.TextField()
    token_expiry = models.DateTimeField()
    scope = models.TextField()

    def __str__(self):
        return f"GoogleCalendarToken({self.user_id})"