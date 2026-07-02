from django.urls import path
from rest_framework import generics, permissions

from .views import PublicUserView, RegisterSerializer, UserProfileView, UserSerializer

User = __import__('django.contrib.auth', fromlist=['get_user_model']).get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', UserProfileView.as_view(), name='profile'),
    path('users/<int:pk>/', PublicUserView.as_view(), name='public-user'),
]
