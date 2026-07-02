import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

from apps.proposals.models import Proposal

from .models import Message

User = get_user_model()

QUICK_REPLY_TEMPLATES = [
    "Hi, I'm interested in trading skills. Let's coordinate a schedule!",
    "Would you be open to adjusting the hours?",
    "I'm available this week — what times work for you?",
    "Thanks for the proposal! Let me review and get back to you.",
]


class ProposalChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.proposal_id = self.scope['url_route']['kwargs']['proposal_id']
        self.room_group_name = f'proposal_{self.proposal_id}'
        self.user = await self.authenticate()

        if not self.user:
            await self.close(code=4001)
            return

        if not await self.user_is_participant():
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'proposal_id': self.proposal_id,
            'quick_replies': QUICK_REPLY_TEMPLATES,
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_text = data.get('message', '').strip()
        if not message_text:
            return

        msg = await self.save_message(message_text)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': msg['id'],
                    'sender_id': self.user.id,
                    'sender_name': self.user.username,
                    'message_text': message_text,
                    'sent_at': msg['sent_at'],
                },
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
        }))

    async def authenticate(self):
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        for part in query_string.split('&'):
            if part.startswith('token='):
                token = part.split('=', 1)[1]
                break

        if not token:
            return None

        try:
            access = AccessToken(token)
            user_id = access['user_id']
            return await database_sync_to_async(User.objects.get)(id=user_id)
        except Exception:
            return None

    @database_sync_to_async
    def user_is_participant(self):
        try:
            proposal = Proposal.objects.get(pk=self.proposal_id)
            return self.user.id in (proposal.sender_id, proposal.receiver_id)
        except Proposal.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, message_text):
        msg = Message.objects.create(
            proposal_id=self.proposal_id,
            sender=self.user,
            message_text=message_text,
        )
        return {
            'id': msg.id,
            'sent_at': msg.sent_at.isoformat(),
        }
