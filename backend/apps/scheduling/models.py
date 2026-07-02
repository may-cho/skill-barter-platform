from django.db import models


class AppointmentStatus(models.TextChoices):
    SCHEDULED = 'Scheduled', 'Scheduled'
    ATTENDED = 'Attended', 'Attended'
    MISSED = 'Missed', 'Missed'
    CANCELED = 'Canceled', 'Canceled'


class Appointment(models.Model):
    proposal = models.ForeignKey(
        'proposals.Proposal',
        on_delete=models.CASCADE,
        related_name='appointments',
    )
    scheduled_time = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField()
    meeting_link = models.URLField(max_length=512, blank=True)
    status = models.CharField(
        max_length=50,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.SCHEDULED,
    )
    google_calendar_event_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'appointments'
        ordering = ['scheduled_time']

    def __str__(self):
        return f'Appointment #{self.pk} for Proposal #{self.proposal_id}'
