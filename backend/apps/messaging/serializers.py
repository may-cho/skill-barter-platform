from rest_framework import serializers
from .models import Message
from ..proposals.models import Proposal


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.ReadOnlyField(source='sender.id')
    sender_name = serializers.ReadOnlyField(source='sender.username')
    message_type = serializers.CharField()
    content = serializers.CharField()
    file_url = serializers.SerializerMethodField()
    metadata = serializers.JSONField()
    time = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            'id',
            'sender_id',
            'sender_name',
            'is_system',
            'message_type',
            'content',
            'file',
            'file_url',
            'metadata',
            'response_status',
            'responded_at',
            'time',
            'status',
        )

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_time(self, obj):
        if not obj.created_at:
            return ""
        return obj.created_at.strftime("%b %d, %I:%M %p")

    def get_status(self, obj):
        if obj.read_at:
            return 'read'
        return 'delivered'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.is_system or not instance.sender_id:
            ret['sender_name'] = 'System'

        # Backend's terms_updated maps to frontend's 'deal' type
        if ret.get('message_type') == Message.MessageType.TERMS_UPDATED:
            ret['message_type'] = 'deal'
        return ret


class ConversationSerializer(serializers.ModelSerializer):
    partner = serializers.SerializerMethodField()
    youGive = serializers.SerializerMethodField()
    youReceive = serializers.SerializerMethodField()
    termsHistory = serializers.SerializerMethodField()
    lastMessage = serializers.SerializerMethodField()
    lastTime = serializers.SerializerMethodField()
    nextSession = serializers.SerializerMethodField()
    unread = serializers.SerializerMethodField()
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Proposal
        fields = (
            'id', 'partner', 'status', 'youGive', 'youReceive', 'termsHistory', 'lastMessage',
            'lastTime', 'nextSession', 'unread', 'messages'
        )

    def _other_user(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return obj.receiver
        return obj.receiver if obj.sender_id == request.user.id else obj.sender

    def _is_sender(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return True
        return obj.sender_id == request.user.id

    def get_partner(self, obj):
        request = self.context.get('request')
        other = self._other_user(obj)

        avatar_url = None
        if other and hasattr(other, 'avatar') and other.avatar:
            avatar_url = request.build_absolute_uri(other.avatar.url) if request else other.avatar.url

        return {
            'id': str(other.id) if other else None,
            'name': getattr(other, 'username', 'Unknown'),
            'avatar': avatar_url,
            'online': False,
            'lastActive': getattr(other, 'last_active_at', None),
            'rating': getattr(other, 'average_rating', 0),
            'trades': getattr(other, 'total_trades', 0),
        }

    def get_youGive(self, obj):
        is_sender = self._is_sender(obj)
        skills = obj.offered_skills.all() if is_sender else obj.requested_skills.all()
        hours = obj.offered_hours if is_sender else obj.requested_hours
        first_skill = skills.first()
        return {
            'skill': ', '.join(s.title for s in skills),
            'hours': float(hours),
            'category': getattr(first_skill, 'category', None),
        }

    def get_youReceive(self, obj):
        is_sender = self._is_sender(obj)
        skills = obj.requested_skills.all() if is_sender else obj.offered_skills.all()
        hours = obj.requested_hours if is_sender else obj.offered_hours
        first_skill = skills.first()
        return {
            'skill': ', '.join(s.title for s in skills),
            'hours': float(hours),
            'category': getattr(first_skill, 'category', None),
        }

    def get_lastMessage(self, obj):
        last = obj.messages.last()
        if not last:
            return ''
        if last.message_type == 'image':
            return '📷 Sent an image'
        if last.message_type == 'file':
            return '📁 Sent a file'
        return last.content if last.content else ''

    def get_lastTime(self, obj):
        last = obj.messages.last()
        return last.created_at.isoformat() if last and last.created_at else obj.created_at.isoformat()

    def get_unread(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return 0
        return obj.messages.filter(read_at__isnull=True).exclude(sender=request.user).count()

    def get_nextSession(self, obj):
        return obj.next_session_at 

    def get_termsHistory(self, obj):
        history = [{
            'id': 'v0',
            'date': obj.created_at.isoformat() if obj.created_at else None,
            'fromGiveH': 0,
            'fromReceiveH': 0,
            'toGiveH': float(obj.offered_hours),
            'toReceiveH': float(obj.requested_hours),
            'note': 'Initial proposal',
        }]

        prev_give = float(obj.offered_hours)
        prev_receive = float(obj.requested_hours)

        for i, co in enumerate(obj.counter_offers.all().order_by('created_at'), start=1):
            to_give = float(co.offered_hours)
            to_receive = float(co.requested_hours)
            history.append({
                'id': f'v{i}',
                'date': co.created_at.isoformat() if co.created_at else None,
                'fromGiveH': prev_give,
                'fromReceiveH': prev_receive,
                'toGiveH': to_give,
                'toReceiveH': to_receive,
                'note': co.message or 'Terms updated',
            })
            prev_give, prev_receive = to_give, to_receive

        return history