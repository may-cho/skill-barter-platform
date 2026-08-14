from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import models
from django.db.models import Q
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response


from apps.admin_dashboard.models import create_admin_notification, create_user_notification
from apps.admin_dashboard.models import UserNotificationType
from ..messaging.models import Message
from ..messaging.views import MessageSerializer,ConversationSerializer
from apps.skills.models import Skill, SkillType
from .models import CounterOffer, Proposal, ProposalStatus
from ..accounts.views import UserSerializer


class CounterOfferSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = CounterOffer
        fields = ('id', 'author', 'author_name', 'offered_hours', 'requested_hours', 'message', 'created_at')
        read_only_fields = ('id', 'author', 'author_name', 'created_at')




class ProposalSerializer(serializers.ModelSerializer):
    offered_skill_titles = serializers.SerializerMethodField()
    requested_skill_titles = serializers.SerializerMethodField()
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    other_user = serializers.SerializerMethodField()
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True)
    class Meta:
        model = Proposal
        fields = (
            'id', 'sender', 'receiver', 'other_user', 'offered_skills', 'offered_skill_titles','offered_hours','sender_name','receiver_name',
            'requested_skills', 'requested_skill_titles','requested_hours', 'status', 'created_at', 'updated_at',
        )


    def get_other_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # return the other participant
            other = obj.receiver if obj.sender == request.user else obj.sender
            return UserSerializer(other, context=self.context).data
        return None

    def get_offered_skill_titles(self, obj):
        return [skill.title for skill in obj.offered_skills.all()]

    def get_requested_skill_titles(self, obj):
        return [skill.title for skill in obj.requested_skills.all()]

class ProposalCreateSerializer(serializers.ModelSerializer):
    offered_skills = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(), many=True
    )
    requested_skills = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(), many=True
    )

    class Meta:
        model = Proposal
        fields = (
            'receiver', 'offered_skills', 'requested_skills', 'message',
            'offered_hours', 'requested_hours',
        )

    def validate(self, data):
        user = self.context['request'].user
        receiver = data['receiver']
        if receiver == user:
            raise serializers.ValidationError('Cannot propose to yourself')

        offered_list = data.get('offered_skills', [])
        requested_list = data.get('requested_skills', [])

        for skill in offered_list:
            if skill.user_id != user.id:
                raise serializers.ValidationError(f'Offered skill {skill.id} must belong to you')
            if skill.type != SkillType.TEACH:
                raise serializers.ValidationError(f'Offered skill {skill.id} must be a teach skill')

        for skill in requested_list:
            if skill.user_id != receiver.id:
                raise serializers.ValidationError(f'Requested skill {skill.id} must belong to receiver')
            if skill.type != SkillType.TEACH:
                raise serializers.ValidationError(f'Requested skill {skill.id} must be a teach skill of the receiver')

        return data

    def create(self, validated_data):
        request_user = self.context['request'].user
        validated_data['sender'] = request_user
        proposal = super().create(validated_data)
        receiver = proposal.receiver
        create_admin_notification(
            'Proposals',
            'New proposal created',
            f'{request_user.username} sent a new proposal to {receiver.username}.',
        )
        # Notify receiver of the new proposal
        create_user_notification(
            recipient=receiver,
            notif_type=UserNotificationType.PROPOSAL_RECEIVED,
            title='New proposal received',
            body=f'{request_user.username} sent you a skill-barter proposal.',
        )
        return proposal
        print("VALIDATED DATA BEFORE POP:", validated_data)
        offered_skills = validated_data.pop('offered_skills', [])
        requested_skills = validated_data.pop('requested_skills', [])

        print("OFFERED SKILLS TO SET:", offered_skills)
        print("REQUESTED SKILLS TO SET:", requested_skills)
        # --------------------

        validated_data['sender'] = self.context['request'].user

        proposal = Proposal.objects.create(**validated_data)
        # Explicitly set M2M relations
        proposal.offered_skills.set(offered_skills)
        proposal.requested_skills.set(requested_skills)
        return proposal


class CounterOfferCreateSerializer(serializers.Serializer):
    offered_hours = serializers.DecimalField(max_digits=4, decimal_places=2)
    requested_hours = serializers.DecimalField(max_digits=4, decimal_places=2)
    message = serializers.CharField(required=False, allow_blank=True)


class ProposalViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return Proposal.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).select_related(
            'sender', 'receiver'
        ).prefetch_related(
            'offered_skills', 'requested_skills', 'counter_offers__author'
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return ProposalCreateSerializer
        return ProposalSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data= request.data)
        serializer.is_valid(raise_exception=True)
        proposal = serializer.save()

        headers = self.get_success_headers(serializer.data)
        response_serailizer = ProposalSerializer(proposal,context = {'request' : request})
        return Response(response_serailizer.data,status=status.HTTP_201_CREATED,headers=headers)


    @action(detail=False, methods=['get'])
    def mine(self, request):
        qs = self.get_queryset()
        return Response(ProposalSerializer(qs, many=True).data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        proposal = self.get_object()
        try:
            proposal.transition_to(ProposalStatus.ACCEPTED, request.user)
        except DjangoValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        create_admin_notification(
            'Proposals',
            'Proposal accepted',
            f'Proposal #{proposal.id} was accepted.',
        )
        # Notify the OTHER party
        other = proposal.receiver if request.user == proposal.sender else proposal.sender
        create_user_notification(
            recipient=other,
            notif_type=UserNotificationType.PROPOSAL_ACCEPTED,
            title='Proposal accepted ✔',
            body=f'{request.user.username} accepted your proposal.',
        )
        return Response(ProposalSerializer(proposal).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        proposal = self.get_object()
        try:
            proposal.transition_to(ProposalStatus.CANCELED, request.user)
        except DjangoValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        create_admin_notification(
            'Proposals',
            'Proposal rejected',
            f'Proposal #{proposal.id} was rejected.',
        )
        other = proposal.receiver if request.user == proposal.sender else proposal.sender
        create_user_notification(
            recipient=other,
            notif_type=UserNotificationType.PROPOSAL_CANCELLED,
            title='Proposal cancelled',
            body=f'{request.user.username} rejected the proposal.',
        )
        return Response(ProposalSerializer(proposal).data)

    @action(detail=True, methods=['post'])
    def counter(self, request, pk=None):
        proposal = self.get_object()
        if proposal.status not in (ProposalStatus.PENDING, ProposalStatus.NEGOTIATING):
            return Response(
                {'detail': 'Counter-offers only allowed during Pending/Negotiating'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ser = CounterOfferCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        counter = CounterOffer.objects.create(
            proposal=proposal,
            author=request.user,
            **ser.validated_data,
        )
        proposal.offered_hours = ser.validated_data['offered_hours']
        proposal.requested_hours = ser.validated_data['requested_hours']
        proposal.status = ProposalStatus.NEGOTIATING
        proposal.save(update_fields=['offered_hours', 'requested_hours', 'status', 'updated_at'])

        # Notify the other party about the counter-offer
        other = proposal.receiver if request.user == proposal.sender else proposal.sender
        create_user_notification(
            recipient=other,
            notif_type=UserNotificationType.COUNTER_OFFER,
            title='Counter-offer received',
            body=f'{request.user.username} made a counter-offer on proposal #{proposal.id}.',
        )

        return Response({
            'proposal': ProposalSerializer(proposal).data,
            'counter_offer': CounterOfferSerializer(counter).data,
        })

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        proposal = self.get_object()
        try:
            proposal.transition_to(ProposalStatus.COMPLETED, request.user)
        except DjangoValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        create_admin_notification(
            'Proposals',
            'Proposal completed',
            f'Proposal #{proposal.id} was completed.',
        )
        return Response(ProposalSerializer(proposal).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        proposal = self.get_object()
        try:
            proposal.transition_to(ProposalStatus.CANCELED, request.user)
        except DjangoValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        other = proposal.receiver if request.user == proposal.sender else proposal.sender
        create_user_notification(
            recipient=other,
            notif_type=UserNotificationType.PROPOSAL_CANCELLED,
            title='Proposal cancelled',
            body=f'{request.user.username} cancelled the proposal.',
        )
        return Response(ProposalSerializer(proposal).data)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        proposal = self.get_object()
        qs = proposal.messages.all().select_related('sender')
        return Response(MessageSerializer(qs, many=True).data)

    @action(detail=False,methods=['get'])
    def conversations(self, request):
        qs = self.get_queryset().prefetch_related('messages','counter_offers').exclude(status=ProposalStatus.CANCELED)
        return Response(
        ConversationSerializer(qs, many=True, context={'request': request}).data
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def calendar_events(request):
    user = request.user

    proposals = Proposal.objects.filter(
        next_session_at__isnull=False
    ).filter(
        models.Q(sender=user) | models.Q(receiver=user)
    )

    serializer = ProposalSerializer(proposals, many=True)
    return Response(serializer.data)