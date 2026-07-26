from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Avg


class User(AbstractUser):
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    is_admin = models.BooleanField(default=False)
    timezone = models.CharField(max_length=100, default='UTC')

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
        ]

    def save(self, *args, **kwargs):
        # ensure Django admin access flags follow is_admin
        if self.is_admin:
            self.is_staff = True
        super().save(*args, **kwargs)

    @property
    def average_rating(self):
        reviews = self.reviews_received.all()
        if not reviews.exists():
            return None
        return round(reviews.aggregate(avg=Avg('rating'))['avg'], 2)
