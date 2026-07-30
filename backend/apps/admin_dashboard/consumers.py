import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


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
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        # Admin may send echo or manage subscriptions; ignore for now
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
