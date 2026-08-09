import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


# ─────────────────────────── Admin WebSocket ───────────────────────────────

class AdminNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = await self.authenticate()
        if not self.user:
            await self.close(code=4001)
            return

        if not (getattr(self.user, 'is_admin', False) or self.user.is_staff or self.user.is_superuser):
            await self.close(code=4003)
            return

        self.group_name = 'admin_notifications'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({'type': 'connection_established'}))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass

    async def admin_notification(self, event):
        await self.send(text_data=json.dumps({'type': 'notification', 'notification': event['notification']}))

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


# ─────────────────────────── User WebSocket ────────────────────────────────

class UserNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = await self.authenticate()
        if not self.user:
            await self.close(code=4001)
            return

        self.group_name = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send initial unread notifications as a batch on connect
        unread = await self.get_unread_notifications()
        await self.send(text_data=json.dumps({
            'type': 'initial_notifications',
            'notifications': unread,
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data.get('type') == 'mark_read':
                await self.mark_all_read()
                await self.send(text_data=json.dumps({'type': 'marked_read'}))
        except Exception:
            pass

    async def user_notification(self, event):
        """Called when a message is sent to the user's channel group."""
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'notification': event['notification'],
        }))

    @database_sync_to_async
    def get_unread_notifications(self):
        from .models import UserNotification
        notifs = UserNotification.objects.filter(
            recipient=self.user
        ).order_by('-created_at')[:50]
        return [
            {
                'id': n.id,
                'type': n.type,
                'title': n.title,
                'body': n.body,
                'is_read': n.is_read,
                'created_at': n.created_at.isoformat(),
            }
            for n in notifs
        ]

    @database_sync_to_async
    def mark_all_read(self):
        from .models import UserNotification
        UserNotification.objects.filter(recipient=self.user, is_read=False).update(is_read=True)

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
