from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
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
        read_only_fields = ('id', 'reviewer', 'reviewer_name', 'reviewee_name', 'created_at', 'reviewee')

    def validate(self, data):
        request = self.context['request']
        proposal = data.get('proposal')

        if not proposal:
            print("DEBUG ERROR: Proposal ID is missing.")
            raise serializers.ValidationError({'proposal': 'A valid proposal ID is required.'})

        if proposal.status != ProposalStatus.COMPLETED:
            print(f"DEBUG ERROR: Proposal status is {proposal.status}, expected COMPLETED.")
            raise serializers.ValidationError(
                'Reviews can only be submitted after a proposal is Completed'
            )

        if Review.objects.filter(proposal=proposal, reviewer=request.user).exists():
            print("DEBUG ERROR: Review already exists for this proposal.")
            raise serializers.ValidationError('You have already reviewed this proposal')

        return data

    def create(self, validated_data):
        request = self.context['request']
        proposal = validated_data.get('proposal')
        reviewer = request.user

        if proposal.sender_id == reviewer.id:
            reviewee = proposal.receiver
        else:
            reviewee = proposal.sender

        validated_data['reviewer'] = reviewer
        validated_data['reviewee'] = reviewee

        return super().create(validated_data)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        return Review.objects.filter(reviewee=user)

    @action(detail=False, methods=['get'], url_path='received')
    def received_reviews(self, request):
        """Endpoint: /api/reviews/received/"""
        reviews = Review.objects.filter(reviewee=request.user)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='given')
    def given_reviews(self, request):
        """Endpoint: /api/reviews/given/"""
        reviews = Review.objects.filter(reviewer=request.user)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)