from rest_framework import permissions, serializers, status, viewsets
from rest_framework.response import Response

from apps.proposals.models import Proposal, ProposalStatus

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.username', read_only=True)
    reviewee_name = serializers.CharField(source='reviewee.username', read_only=True)

    class Meta:
        model = Review
        fields = (
            'id', 'proposal', 'reviewer', 'reviewer_name',
            'reviewee', 'reviewee_name', 'rating', 'comment', 'created_at',
        )
        read_only_fields = ('id', 'reviewer', 'reviewer_name', 'reviewee_name', 'created_at')

    def validate(self, data):
        request = self.context['request']
        proposal = data.get('proposal') or self.instance.proposal if self.instance else None

        if proposal.status != ProposalStatus.COMPLETED:
            raise serializers.ValidationError(
                'Reviews can only be submitted after a proposal is Completed'
            )

        if request.user.id not in (proposal.sender_id, proposal.receiver_id):
            raise serializers.ValidationError('You are not a participant in this proposal')

        reviewee = data.get('reviewee')
        if reviewee.id == request.user.id:
            raise serializers.ValidationError('You cannot review yourself')

        if reviewee.id not in (proposal.sender_id, proposal.receiver_id):
            raise serializers.ValidationError('Reviewee must be the other participant')

        if Review.objects.filter(proposal=proposal, reviewer=request.user).exists():
            raise serializers.ValidationError('You have already reviewed this proposal')

        return data

    def create(self, validated_data):
        validated_data['reviewer'] = self.context['request'].user
        return super().create(validated_data)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        return Review.objects.filter(reviewee=user) | Review.objects.filter(reviewer=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
