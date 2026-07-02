from django.conf import settings
from django.db import models


class Message(models.Model):
    proposal = models.ForeignKey(
        'proposals.Proposal',
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='sent_messages',
    )
    message_text = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        indexes = [
            models.Index(fields=['proposal'], name='idx_messages_proposal'),
        ]
        ordering = ['sent_at']

    def __str__(self):
        return f'Message #{self.pk} in Proposal #{self.proposal_id}'
