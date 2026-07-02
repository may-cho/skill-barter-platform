from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Avg


class User(AbstractUser):
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    timezone = models.CharField(max_length=100, default='UTC')

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
        ]

    @property
    def average_rating(self):
        reviews = self.reviews_received.all()
        if not reviews.exists():
            return None
        return round(reviews.aggregate(avg=Avg('rating'))['avg'], 2)
