from rest_framework import permissions, serializers, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.proposals.models import Proposal

from .consumers import QUICK_REPLY_TEMPLATES
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'proposal', 'sender', 'sender_name', 'message_text', 'sent_at')
        read_only_fields = ('id', 'sender', 'sent_at', 'sender_name')


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            proposal__sender=user
        ) | Message.objects.filter(
            proposal__receiver=user
        )

    def perform_create(self, serializer):
        proposal = serializer.validated_data['proposal']
        if self.request.user.id not in (proposal.sender_id, proposal.receiver_id):
            raise ValidationError('Not a participant in this proposal')
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=['get'], url_path='proposal/(?P<proposal_id>[^/.]+)')
    def by_proposal(self, request, proposal_id=None):
        try:
            proposal = Proposal.objects.get(pk=proposal_id)
        except Proposal.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)

        if request.user.id not in (proposal.sender_id, proposal.receiver_id):
            return Response({'detail': 'Forbidden'}, status=403)

        messages = Message.objects.filter(proposal=proposal).select_related('sender')
        return Response({
            'messages': MessageSerializer(messages, many=True).data,
            'quick_replies': QUICK_REPLY_TEMPLATES,
        })
