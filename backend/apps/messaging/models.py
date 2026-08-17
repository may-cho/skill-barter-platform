import uuid
from django.db import models, transaction
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone

class Message(models.Model):
    class MessageType(models.TextChoices):
        TEXT = 'text', 'Text'
        IMAGE = 'image', 'Image'
        FILE = 'file', 'File'
        TERM_PROPOSAL = 'term_proposal', 'Term Proposal'
        SESSION_PROPOSAL = 'session_proposal', 'Session Proposal'
        TERMS_UPDATED = 'terms_updated', 'Terms Updated'
        SESSION_CONFIRMED = 'session_confirmed', 'Session Confirmed'
        SYSTEM = 'system', 'System'

    class ResponseStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        DECLINED = 'declined', 'Declined'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal = models.ForeignKey(
        'proposals.Proposal',
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='sent_messages',
        null=True,
        blank=True,  # null for system messages
    )
    message_type = models.CharField(
        max_length=20,
        choices=MessageType.choices,
        default=MessageType.TEXT,
    )
    content = models.TextField(blank=True)  # message body, system text, or file caption

    # File Attachment for IMAGE or FILE message types
    file = models.FileField(
        upload_to='chat_attachments/%Y/%m/%d/',
        null=True,
        blank=True,
    )

    # Flexible storage for proposed terms, session slots, deal snapshots, or file metadata (file_name, file_size, mime_type)
    metadata = models.JSONField(default=dict, blank=True)

    # For TERM_PROPOSAL / SESSION_PROPOSAL only
    response_status = models.CharField(
        max_length=10,
        choices=ResponseStatus.choices,
        null=True,
        blank=True,
    )
    responded_at = models.DateTimeField(null=True, blank=True)

    # Read tracking
    read_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['proposal', 'created_at'], name='idx_messages_proposal_created'),
            models.Index(fields=['proposal', 'message_type'], name='idx_messages_proposal_type'),
            models.Index(fields=['response_status'], name='idx_messages_response'),
        ]

    def __str__(self):
        return f'{self.message_type} #{self.pk} in Proposal #{self.proposal_id}'

    @property
    def is_proposal(self):
        return self.message_type in (
            self.MessageType.TERM_PROPOSAL,
            self.MessageType.SESSION_PROPOSAL,
        )

    @property
    def is_system(self):
        return self.sender is None

    @property
    def is_media(self):
        return self.message_type in (
            self.MessageType.IMAGE,
            self.MessageType.FILE,
        )

    @property
    def delivery_status(self):
        """Derived read/delivery state — distinct from Proposal.status (negotiation lifecycle)."""
        if self.is_system:
            return None
        if self.read_at is not None:
            return 'seen'
        return 'delivered'

    @transaction.atomic
    def accept_term_proposal(self, user):
        """Apply this term proposal to the parent Proposal and record a system event."""
        if self.message_type != self.MessageType.TERM_PROPOSAL:
            raise ValidationError('Not a term proposal')
        if self.response_status != self.ResponseStatus.PENDING:
            raise ValidationError('Proposal already responded to')
        if user.id not in (self.proposal.sender_id, self.proposal.receiver_id):
            raise ValidationError('Only participants can respond')

        # Update proposal current terms
        meta = self.metadata
        if 'offered_hours' in meta:
            self.proposal.offered_hours = meta['offered_hours']
        if 'requested_hours' in meta:
            self.proposal.requested_hours = meta['requested_hours']
        # If you allow changing skills too, add skill ID handling here
        self.proposal.save(update_fields=['offered_hours', 'requested_hours', 'updated_at'])

        # Mark this message as accepted
        self.response_status = self.ResponseStatus.ACCEPTED
        self.responded_at = timezone.now()
        self.save(update_fields=['response_status', 'responded_at', 'updated_at'])

        # Create system confirmation message
        Message.objects.create(
            proposal=self.proposal,
            sender=None,
            message_type=self.MessageType.TERMS_UPDATED,
            content='Terms updated',
            metadata={
                'offered_skills': [s.title for s in self.proposal.offered_skills.all()],
                'offered_hours': float(self.proposal.offered_hours),
                'requested_skills': [s.title for s in self.proposal.requested_skills.all()],
                'requested_hours': float(self.proposal.requested_hours),
            },
        )
        return self