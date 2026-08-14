from django.urls import re_path
from .consumers import AdminNotificationConsumer, UserNotificationConsumer

websocket_urlpatterns = [
    re_path(r'ws/admin/notifications/$', AdminNotificationConsumer.as_asgi()),
    re_path(r'ws/user/notifications/$', UserNotificationConsumer.as_asgi()),
]
