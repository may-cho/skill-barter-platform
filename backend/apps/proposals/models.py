from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction


class ProposalStatus(models.TextChoices):
    PENDING = 'Pending', 'Pending'
    NEGOTIATING = 'Negotiating', 'Negotiating'
    ACCEPTED = 'Accepted', 'Accepted'
    COMPLETED = 'Completed', 'Completed'
    CANCELED = 'Canceled', 'Canceled'


# Valid state transitions: Pending -> Negotiating <-> Accepted -> Completed / Canceled
VALID_TRANSITIONS = {
    ProposalStatus.PENDING: {ProposalStatus.NEGOTIATING, ProposalStatus.ACCEPTED, ProposalStatus.CANCELED},
    ProposalStatus.NEGOTIATING: {ProposalStatus.ACCEPTED, ProposalStatus.CANCELED, ProposalStatus.NEGOTIATING},
    ProposalStatus.ACCEPTED: {ProposalStatus.COMPLETED, ProposalStatus.CANCELED},
    ProposalStatus.COMPLETED: set(),
    ProposalStatus.CANCELED: set(),
}


class Proposal(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='sent_proposals',
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='received_proposals',
    )
    offered_skill = models.ForeignKey(
        'skills.Skill',
        on_delete=models.SET_NULL,
        null=True,
        related_name='offered_in_proposals',
    )
    requested_skill = models.ForeignKey(
        'skills.Skill',
        on_delete=models.SET_NULL,
        null=True,
        related_name='requested_in_proposals',
    )
    offered_hours = models.DecimalField(max_digits=4, decimal_places=2)
    requested_hours = models.DecimalField(max_digits=4, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=ProposalStatus.choices,
        default=ProposalStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'proposals'
        indexes = [
            models.Index(fields=['status'], name='idx_proposals_status'),
        ]
        ordering = ['-updated_at']

    def __str__(self):
        return f'Proposal #{self.pk}: {self.sender} -> {self.receiver} [{self.status}]'

    def can_transition_to(self, new_status):
        return new_status in VALID_TRANSITIONS.get(self.status, set())

    @transaction.atomic
    def transition_to(self, new_status, user):
        if not self.can_transition_to(new_status):
            raise ValidationError(
                f'Cannot transition from {self.status} to {new_status}'
            )
        if user.id not in (self.sender_id, self.receiver_id):
            raise ValidationError('Only proposal participants can change status')
        self.status = new_status
        self.save(update_fields=['status', 'updated_at'])
        return self


class CounterOffer(models.Model):
    proposal = models.ForeignKey(
        Proposal,
        on_delete=models.CASCADE,
        related_name='counter_offers',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
    )
    offered_hours = models.DecimalField(max_digits=4, decimal_places=2)
    requested_hours = models.DecimalField(max_digits=4, decimal_places=2)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
