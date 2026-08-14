import json
import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import AccessToken

from apps.proposals.models import Proposal
from .models import Message
from .serializers import MessageSerializer
from .constants import QUICK_REPLY_TEMPLATES

User = get_user_model()
logger = logging.getLogger(__name__)

VALID_MESSAGE_TYPES = {choice[0] for choice in Message.MessageType.choices}


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

    # ─── Dispatch entry point ───────────────────────────────────────
    # Frontend → backend frame shape (from useChatWebSocket.js):
    #   { message_type: "text" | "session_proposal" | "term_proposal" | ...,
    #     content: "...", metadata: {...}, action?: "respond_to_proposal" }
    async def receive(self, text_data):
        logger.info("Received WebSocket message: %s", text_data)
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            logger.warning("Received invalid JSON frame: %s", text_data)
            await self.send_error("Invalid JSON")
            return

        action = data.get('action', 'send_message')

        try:
            if action == 'send_message':
                await self.handle_send_message(data)
            elif action == 'respond_to_proposal':
                await self.handle_respond_to_proposal(data)
            else:
                logger.warning("Unknown action received: %s", action)
                await self.send_error(f"Unknown action: {action}")
        except ValidationError as e:
            logger.warning("Validation error handling action=%s: %s", action, e)
            await self.send_error(str(e))
        except Exception:
            logger.exception("Unhandled error processing action=%s", action)
            await self.send_error("Something went wrong processing your message")

    # ─── action: send_message ───────────────────────────────────────
    async def handle_send_message(self, data):
        # Frontend sends 'content' (see useChatWebSocket.js sendMessage) — read that key directly.
        message_text = (data.get('content') or '').strip()

        # Frontend sends 'message_type' (snake_case, set inside the hook regardless of
        # the camelCase 'messageType' param name used at call sites in NegotiationPage.jsx).
        msg_type = data.get('message_type', Message.MessageType.TEXT)
        if msg_type not in VALID_MESSAGE_TYPES:
            logger.warning("Unrecognized message_type '%s', defaulting to text", msg_type)
            msg_type = Message.MessageType.TEXT

        metadata = data.get('metadata', {})
        if not isinstance(metadata, dict):
            metadata = {}

        # Proposal types are allowed to carry no free-text content — the metadata is the payload
        if not message_text and msg_type not in (
            Message.MessageType.TERM_PROPOSAL,
            Message.MessageType.SESSION_PROPOSAL,
        ):
            logger.warning("Received empty content for type=%s", msg_type)
            return

        resolved_content = message_text or self.default_content_for(msg_type)

        serialized_msg = await self.save_message(resolved_content, msg_type, metadata)
        await self.broadcast_message(serialized_msg)

    # ─── action: respond_to_proposal (accept/decline) ───────────────
    async def handle_respond_to_proposal(self, data):
        message_id = data.get('message_id')
        response = data.get('response')  # 'accepted' or 'declined'

        if not message_id or response not in ('accepted', 'declined'):
            raise ValidationError("respond_to_proposal requires message_id and response")

        if response == 'accepted':
            result_msg = await self.accept_proposal(message_id)
        else:
            result_msg = await self.decline_proposal(message_id)

        await self.broadcast_message(result_msg)

    # ─── Group broadcast (Channels-internal plumbing) ────────────────
    # The dict below is NOT sent to the browser as-is. Channels reads its 'type' key
    # to decide which method to call on every consumer subscribed to this group —
    # here, that's chat_message() just below. 'message' is our own key name, chosen
    # by us, holding the already-serialized Message row from save_message()/accept_proposal().
    async def broadcast_message(self, serialized_msg):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',     # Channels routing — always this literal string
                'message': serialized_msg,  # our payload, read back via event['message'] below
            },
        )

    # event == the dict passed to group_send above, delivered to this consumer instance
    # by Channels. event['message'] is the serialized Message dict we put there ourselves.
    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': message['message_type'],  # real message type, exposed to the client
            'message': message,
        }))

    async def send_error(self, detail):
        await self.send(text_data=json.dumps({
            'type': 'error',
            'detail': detail,
        }))

    # ─── Helpers ──────────────────────────────────────────────────────
    @staticmethod
    def default_content_for(msg_type):
        return {
            Message.MessageType.SESSION_PROPOSAL: 'Sent a schedule proposal',
            Message.MessageType.TERM_PROPOSAL: 'Sent a term change proposal',
        }.get(msg_type, '')

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
            logger.exception("Authentication failed")
            return None

    @database_sync_to_async
    def user_is_participant(self):
        try:
            proposal = Proposal.objects.get(pk=self.proposal_id)
            return self.user.id in (proposal.sender_id, proposal.receiver_id)
        except Proposal.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content, msg_type, metadata):
        msg = Message.objects.create(
            proposal_id=self.proposal_id,
            sender=self.user,
            message_type=msg_type,
            content=content,
            metadata=metadata,
            response_status=(
                Message.ResponseStatus.PENDING
                if msg_type in (Message.MessageType.TERM_PROPOSAL, Message.MessageType.SESSION_PROPOSAL)
                else None
            ),
        )
        return MessageSerializer(msg, context={'user': self.user}).data

    @database_sync_to_async
    def accept_proposal(self, message_id):
        msg = Message.objects.select_related('proposal').get(pk=message_id, proposal_id=self.proposal_id)

        if msg.message_type == Message.MessageType.TERM_PROPOSAL:
            msg.accept_term_proposal(self.user)  # existing model method, raises ValidationError on misuse
        elif msg.message_type == Message.MessageType.SESSION_PROPOSAL:
            if msg.response_status != Message.ResponseStatus.PENDING:
                raise ValidationError('Proposal already responded to')
            msg.response_status = Message.ResponseStatus.ACCEPTED
            msg.save(update_fields=['response_status', 'updated_at'])
            # NOTE: session_confirmed system message + Proposal.next_session_at update
            # not implemented yet — add here if you want backend-driven confirmation.
        else:
            raise ValidationError(f'Message type {msg.message_type} cannot be responded to')

        return MessageSerializer(msg, context={'user': self.user}).data

    @database_sync_to_async
    def decline_proposal(self, message_id):
        msg = Message.objects.get(pk=message_id, proposal_id=self.proposal_id)
        if msg.message_type not in (Message.MessageType.TERM_PROPOSAL, Message.MessageType.SESSION_PROPOSAL):
            raise ValidationError(f'Message type {msg.message_type} cannot be responded to')
        if msg.response_status != Message.ResponseStatus.PENDING:
            raise ValidationError('Proposal already responded to')

        msg.response_status = Message.ResponseStatus.DECLINED
        msg.save(update_fields=['response_status', 'updated_at'])
        return MessageSerializer(msg, context={'user': self.user}).data