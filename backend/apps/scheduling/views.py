from rest_framework import permissions, serializers, status, viewsets
from rest_framework.response import Response

from apps.proposals.models import Proposal, ProposalStatus

from .calendar_hooks import sync_appointment_to_google_calendar
from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    scheduled_time_local = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = (
            'id', 'proposal', 'scheduled_time', 'scheduled_time_local',
            'duration_minutes', 'meeting_link', 'status',
            'google_calendar_event_id', 'created_at',
        )
        read_only_fields = ('id', 'google_calendar_event_id', 'created_at')

    def get_scheduled_time_local(self, obj):
        request = self.context.get('request')
        tz_name = 'UTC'
        if request and request.user.is_authenticated:
            tz_name = request.user.timezone or 'UTC'
        import zoneinfo
        try:
            tz = zoneinfo.ZoneInfo(tz_name)
        except Exception:
            tz = zoneinfo.ZoneInfo('UTC')
        local = obj.scheduled_time.astimezone(tz)
        return local.isoformat()


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return Appointment.objects.filter(
            proposal__sender=user
        ) | Appointment.objects.filter(
            proposal__receiver=user
        )

    def create(self, request, *args, **kwargs):
        proposal_id = request.data.get('proposal')
        try:
            proposal = Proposal.objects.get(pk=proposal_id)
        except Proposal.DoesNotExist:
            return Response({'detail': 'Proposal not found'}, status=status.HTTP_404_NOT_FOUND)

        if proposal.status != ProposalStatus.ACCEPTED:
            return Response(
                {'detail': 'Appointments can only be scheduled for Accepted proposals'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.id not in (proposal.sender_id, proposal.receiver_id):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()
        sync_appointment_to_google_calendar(appointment)
        return Response(
            self.get_serializer(appointment).data,
            status=status.HTTP_201_CREATED,
        )
