from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, serializers

from apps.admin_dashboard.models import create_admin_notification

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    average_rating = serializers.FloatField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'bio', 'location', 'timezone', 'average_rating', 'date_joined',
            'is_staff', 'is_superuser', 'is_admin',
        )
        read_only_fields = ('id', 'date_joined', 'average_rating', 'is_staff', 'is_superuser', 'is_admin')


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
