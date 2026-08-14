from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views
from .views import ProposalViewSet

router = DefaultRouter()
router.register('', ProposalViewSet, basename='proposal')

urlpatterns = [
    path('calendar-events/', views.calendar_events),
    path('', include(router.urls))
]
