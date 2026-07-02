from django.urls import re_path

from .consumers import ProposalChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/proposal/(?P<proposal_id>\d+)/$', ProposalChatConsumer.as_asgi()),
]
