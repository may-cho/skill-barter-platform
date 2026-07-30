from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/admin/', include('apps.admin_dashboard.urls')),
    path('api/skills/', include('apps.skills.urls')),
    path('api/proposals/', include('apps.proposals.urls')),
    path('api/messages/', include('apps.messaging.urls')),
    path('api/appointments/', include('apps.scheduling.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
]
