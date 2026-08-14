from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.proposals.models import Proposal
from apps.skills.models import Skill

from .serializers import (
    AdminUserSerializer, ProposalSerializer, SkillSerializer,
    NotificationSerializer, UserNotificationSerializer,
)
from .models import Notification, UserNotification
from .permissions import IsAdminOrStaff

User = get_user_model()


# ─────────────────────────── Admin Views ───────────────────────────────────

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


class DashboardStatsView(APIView):
    permission_classes = (IsAdminOrStaff,)

    def get(self, request):
        users_count = User.objects.count()
        skills_count = Skill.objects.count()
        proposals_count = Proposal.objects.count()
        pending_proposals = Proposal.objects.filter(status='Pending').count()
        active_users = User.objects.filter(is_active=True).count()
        return Response({
            'users_count': users_count,
            'skills_count': skills_count,
            'proposals_count': proposals_count,
            'pending_proposals': pending_proposals,
            'active_users': active_users,
        })


class NotificationListCreateView(generics.ListCreateAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = (IsAdminOrStaff,)

    def perform_create(self, serializer):
        notif = serializer.save()
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            layer = get_channel_layer()
            async_to_sync(layer.group_send)('admin_notifications', {
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


# ─────────────────────────── User Notification Views ───────────────────────

class UserNotificationListView(generics.ListAPIView):
    serializer_class = UserNotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return UserNotification.objects.filter(
            recipient=self.request.user
        ).order_by('-created_at')[:100]


class UserNotificationMarkReadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        updated = UserNotification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)
        return Response({'marked_read': updated})


class UserNotificationUnreadCountView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        count = UserNotification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return Response({'unread_count': count})
