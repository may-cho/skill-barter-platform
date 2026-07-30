from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, serializers
from django.db.models import Q, Avg

from apps.admin_dashboard.models import create_admin_notification
from apps.skills.models import Skill
from apps.reviews.models import Review
from apps.proposals.models import Proposal, ProposalStatus

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    average_rating = serializers.FloatField(read_only=True)
    overall_rating = serializers.SerializerMethodField()
    skills_detail = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    barter_history = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'bio', 'location', 'timezone', 'average_rating', 'overall_rating',
            'skills_detail', 'reviews', 'barter_history', 'date_joined',
            'is_staff', 'is_superuser', 'is_admin',
        )
        read_only_fields = ('id', 'date_joined', 'average_rating', 'overall_rating', 'is_staff', 'is_superuser',
                            'is_admin')

    def get_overall_rating(self, obj):
        avg = Review.objects.filter(reviewee=obj).aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0.0

    def get_skills_detail(self, obj):
        skills = Skill.objects.filter(user=obj)
        return [
            {
                "title": s.title,
                "category": getattr(s, 'category', ''),
                "level": s.experience_level
            }
            for s in skills
        ]

    def get_reviews(self, obj):
        received_reviews = Review.objects.filter(reviewee=obj).select_related('reviewer', 'proposal__offered_skill')[:5]
        return [
            {
                "comment": rev.comment,
                "rating": rev.rating,
                "partner_name": rev.reviewer.username,
                "skill_name": rev.proposal.offered_skill.title if rev.proposal and rev.proposal.offered_skill else "Skill Exchange"
            }
            for rev in received_reviews
        ]

    def get_barter_history(self, obj):
        completed_proposals = Proposal.objects.filter(
            Q(sender=obj) | Q(receiver=obj),
            status=ProposalStatus.COMPLETED
        ).select_related('sender', 'receiver', 'offered_skill', 'requested_skill')[:5]

        history = []
        for p in completed_proposals:
            is_sender = p.sender_id == obj.id
            partner = p.receiver if is_sender else p.sender
            taught = p.offered_skill.title if is_sender and p.offered_skill else (
                p.requested_skill.title if p.requested_skill else "Skill")
            learned = p.requested_skill.title if is_sender and p.requested_skill else (
                p.offered_skill.title if p.offered_skill else "Skill")

            history.append({
                "partner_name": partner.username,
                "taught_skill": taught,
                "learned_skill": learned
            })
        return history


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'bio', 'location', 'timezone')

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        create_admin_notification(
            'Users',
            'New user registered',
            f'{user.username} joined the platform.',
        )
        return user


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class PublicUserView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'pk'