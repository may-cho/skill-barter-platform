from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.proposals.models import Proposal
from apps.skills.models import Skill
from .models import Notification, UserNotification

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'is_admin', 'is_active', 'date_joined')


class ProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = ('id', 'sender', 'receiver', 'offered_skill', 'requested_skill', 'status', 'created_at', 'updated_at')


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ('id', 'user', 'type', 'category', 'title', 'description', 'experience_level', 'created_at')


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'topic', 'title', 'body', 'created_at')


class UserNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotification
        fields = ('id', 'type', 'title', 'body', 'is_read', 'created_at')
        read_only_fields = ('id', 'type', 'title', 'body', 'created_at')
