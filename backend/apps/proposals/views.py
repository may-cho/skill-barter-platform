from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import models
from django.db.models import Q
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action,api_view,permission_classes
from rest_framework.response import Response


from apps.skills.models import Skill, SkillType

from .models import CounterOffer, Proposal, ProposalStatus


class CounterOfferSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = CounterOffer
        fields = ('id', 'author', 'author_name', 'offered_hours', 'requested_hours', 'message', 'created_at')
        read_only_fields = ('id', 'author', 'author_name', 'created_at')

class CalendarEventSerializer(serializers.Serializer):
    title = serializers.SerializerMethodField()
    start = serializers.DateTimeField(source="scheduled_start")
    end = serializers.DateTimeField(source="scheduled_end")
    extendedProps = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = ['id','title','start','end','extendedProps']


    def get_title(self, obj):
        return f"#{obj.id}: {obj.offered_skill.title} <-> {object.requested_skill.title}"

    def get_extendedProps(self, obj):
        return {
            'status' : obj.status
        }

class ProposalSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True)
    offered_skill_title = serializers.CharField(source='offered_skill.title', read_only=True)
    requested_skill_title = serializers.CharField(source='requested_skill.title', read_only=True)
    counter_offers = CounterOfferSerializer(many=True, read_only=True)

    class Meta:
        model = Proposal
        fields = (
            'id', 'sender', 'sender_name', 'receiver', 'receiver_name',
            'offered_skill', 'offered_skill_title', 'requested_skill',
            'requested_skill_title', 'offered_hours', 'requested_hours',
            'status', 'counter_offers', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'sender', 'status', 'created_at', 'updated_at')


class ProposalCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = (
            'receiver', 'offered_skill', 'requested_skill',
            'offered_hours', 'requested_hours',
        )

    def validate(self, data):
        user = self.context['request'].user
        receiver = data['receiver']
        if receiver == user:
            raise serializers.ValidationError('Cannot propose to yourself')

        offered = data.get('offered_skill')
        requested = data.get('requested_skill')

        if offered and offered.user_id != user.id:
            raise serializers.ValidationError('Offered skill must belong to you')
        if offered and offered.type != SkillType.TEACH:
            raise serializers.ValidationError('Offered skill must be a teach skill')

        if requested and requested.user_id != receiver.id:
            raise serializers.ValidationError('Requested skill must belong to receiver')
        if requested and requested.type != SkillType.TEACH:
            raise serializers.ValidationError('Requested skill must be a teach skill of the receiver')

        return data

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class CounterOfferCreateSerializer(serializers.Serializer):
    offered_hours = serializers.DecimalField(max_digits=4, decimal_places=2)
    requested_hours = serializers.DecimalField(max_digits=4, decimal_places=2)
    message = serializers.CharField(required=False, allow_blank=True)


class ProposalViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return Proposal.objects.filter(
            models.Q(sender=user) | models.Q(receiver=user)
        ).select_related(
            'sender', 'receiver', 'offered_skill', 'requested_skill'
        ).prefetch_related('counter_offers__author')

    def get_serializer_class(self):
        if self.action == 'create':
            return ProposalCreateSerializer
        return ProposalSerializer

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
        return Response(ProposalSerializer(proposal).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        proposal = self.get_object()
        try:
            proposal.transition_to(ProposalStatus.CANCELED, request.user)
        except DjangoValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
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
        return Response(ProposalSerializer(proposal).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        proposal = self.get_object()
        try:
            proposal.transition_to(ProposalStatus.CANCELED, request.user)
        except DjangoValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProposalSerializer(proposal).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def calendar_events(request):
   
    proposals = Proposal.objects.filter(
        Q(sender=request.user) | Q(receiver=request.user),
        sheduled_start__isnull=False,
    )
    
    serializer = CalendarEventSerializer(proposals, many=True)
    return Response(serializer.data)
