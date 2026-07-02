from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Skill, SkillType

User = get_user_model()


class SkillSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Skill
        fields = (
            'id', 'user', 'user_name', 'type', 'category', 'title',
            'description', 'experience_level', 'created_at',
        )
        read_only_fields = ('id', 'user', 'created_at', 'user_name')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class MatchSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    bio = serializers.CharField()
    timezone = serializers.CharField()
    location = serializers.CharField()
    match_score = serializers.IntegerField()
    i_can_teach_for_them = serializers.ListField(child=serializers.CharField())
    they_can_teach_for_me = serializers.ListField(child=serializers.CharField())


class SkillViewSet(viewsets.ModelViewSet):
    serializer_class = SkillSerializer
    filterset_fields = ('type', 'category', 'experience_level', 'user')
    search_fields = ('title', 'description')
    ordering_fields = ('created_at', 'title')

    def get_queryset(self):
        return Skill.objects.select_related('user')

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'matches', 'categories'):
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def mine(self, request):
        teach = self.get_queryset().filter(user=request.user, type=SkillType.TEACH)
        learn = self.get_queryset().filter(user=request.user, type=SkillType.LEARN)
        return Response({
            'teach': SkillSerializer(teach, many=True).data,
            'learn': SkillSerializer(learn, many=True).data,
        })

    @action(detail=False, methods=['get'])
    def categories(self, request):
        from .models import SkillCategory
        return Response([{'value': c.value, 'label': c.label} for c in SkillCategory])

    @action(detail=False, methods=['get'])
    def matches(self, request):
        """Smart Match Intersect: find users with reciprocal skill compatibility."""
        user = request.user
        my_teach = Skill.objects.filter(user=user, type=SkillType.TEACH).values_list('category', 'title')
        my_learn = Skill.objects.filter(user=user, type=SkillType.LEARN).values_list('category', 'title')

        if not my_teach.exists() or not my_learn.exists():
            return Response([])

        teach_cats = {t[0] for t in my_teach}
        learn_cats = {l[0] for l in my_learn}

        candidates = User.objects.exclude(id=user.id).filter(
            Q(skills__type=SkillType.TEACH, skills__category__in=learn_cats)
            | Q(skills__type=SkillType.LEARN, skills__category__in=teach_cats)
        ).distinct()

        results = []
        for candidate in candidates:
            their_teach = Skill.objects.filter(user=candidate, type=SkillType.TEACH)
            their_learn = Skill.objects.filter(user=candidate, type=SkillType.LEARN)

            i_teach_they_want = [
                s.title for s in Skill.objects.filter(user=user, type=SkillType.TEACH)
                if their_learn.filter(category=s.category).exists()
            ]
            they_teach_i_want = [
                s.title for s in their_teach
                if Skill.objects.filter(user=user, type=SkillType.LEARN, category=s.category).exists()
            ]

            if not i_teach_they_want and not they_teach_i_want:
                continue

            score = len(i_teach_they_want) + len(they_teach_i_want)
            results.append({
                'user_id': candidate.id,
                'username': candidate.username,
                'bio': candidate.bio,
                'timezone': candidate.timezone,
                'location': candidate.location,
                'match_score': score,
                'i_can_teach_for_them': i_teach_they_want,
                'they_can_teach_for_me': they_teach_i_want,
            })

        results.sort(key=lambda x: x['match_score'], reverse=True)
        return Response(MatchSerializer(results, many=True).data)
