from django.contrib.auth import get_user_model
from rest_framework import generics
from apps.proposals.models import Proposal
from apps.skills.models import Skill

from .serializers import AdminUserSerializer, ProposalSerializer, SkillSerializer, NotificationSerializer
from .models import Notification
from .permissions import IsAdminOrStaff

User = get_user_model()


class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = (IsAdminOrStaff,)


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = (IsAdminOrStaff,)


class AdminProposalListView(generics.ListAPIView):
    queryset = Proposal.objects.all().order_by('-updated_at')
    serializer_class = ProposalSerializer
    permission_classes = (IsAdminOrStaff,)


class AdminProposalDetailView(generics.RetrieveUpdateAPIView):
    queryset = Proposal.objects.all().order_by('-updated_at')
    serializer_class = ProposalSerializer
    permission_classes = (IsAdminOrStaff,)


class AdminSkillListView(generics.ListAPIView):
    queryset = Skill.objects.all().order_by('-created_at')
    serializer_class = SkillSerializer
    permission_classes = (IsAdminOrStaff,)


class AdminSkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Skill.objects.all().order_by('-created_at')
    serializer_class = SkillSerializer
    permission_classes = (IsAdminOrStaff,)


class NotificationListCreateView(generics.ListCreateAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = (IsAdminOrStaff,)

    def perform_create(self, serializer):
        notif = serializer.save()
        # Broadcast to channel layer
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            layer = get_channel_layer()
            group = f'admin_notifications'
            async_to_sync(layer.group_send)(group, {
                'type': 'admin.notification',
                'notification': {
                    'id': notif.id,
                    'topic': notif.topic,
                    'title': notif.title,
                    'body': notif.body,
                    'created_at': notif.created_at.isoformat(),
                }
            })
        except Exception:
            pass
