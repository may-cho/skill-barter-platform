from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from .models import Message
from ..messaging.serializers import MessageSerializer, ConversationSerializer
from ..proposals.models import Proposal


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (JSONParser, MultiPartParser, FormParser)
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
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.id not in (proposal.sender_id, proposal.receiver_id):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        messages = Message.objects.filter(proposal=proposal).select_related('sender')
        return Response({
            'messages': MessageSerializer(messages, many=True, context={'request': request}).data,
            'quick_replies': QUICK_REPLY_TEMPLATES,
        })

    # -------------------------------------------------------------
    # 📎 Real-time File Upload Endpoint
    # POST /api/messages/upload_file/
    # -------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='upload_file')
    def upload_file(self, request):
        file_obj = request.FILES.get('file')
        proposal_id = request.data.get('proposal_id')

        if not file_obj or not proposal_id:
            return Response(
                {'detail': 'Both "file" and "proposal_id" are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            proposal = Proposal.objects.get(pk=proposal_id)
        except Proposal.DoesNotExist:
            return Response({'detail': 'Proposal not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.id not in (proposal.sender_id, proposal.receiver_id):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        is_image = file_obj.content_type.startswith('image/')
        msg_type = Message.MessageType.IMAGE if is_image else Message.MessageType.FILE

        message = Message.objects.create(
            proposal=proposal,
            sender=request.user,
            message_type=msg_type,
            content=request.data.get('content', ''),
            file=file_obj,
            metadata={
                'file_name': file_obj.name,
                'file_size': file_obj.size,
                'content_type': file_obj.content_type,
            }
        )

        # Context ကို context={'user': request.user} ပြောင်းပါ
        serialized_msg = MessageSerializer(message, context={'user': request.user}).data

        # WebSocket Broadcast
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'proposal_{proposal_id}',
            {
                'type': 'chat_message',
                'message': serialized_msg,
            }
        )

        return Response(serialized_msg, status=status.HTTP_201_CREATED)
