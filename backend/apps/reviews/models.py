from django.conf import settings
from django.db import models


class Review(models.Model):
    proposal = models.ForeignKey(
        'proposals.Proposal',
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='reviews_given',
    )
    reviewee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='reviews_received',
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        constraints = [
            models.UniqueConstraint(
                fields=['proposal', 'reviewer'],
                name='unique_proposal_reviewer',
            ),
            models.CheckConstraint(
                check=models.Q(rating__gte=1) & models.Q(rating__lte=5),
                name='rating_range_check',
            ),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'Review by {self.reviewer} for {self.reviewee} ({self.rating}★)'
