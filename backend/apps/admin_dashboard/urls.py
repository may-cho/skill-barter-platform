from django.urls import path
from . import views

app_name = 'admin_dashboard'

urlpatterns = [
    path('users/', views.AdminUserListView.as_view(), name='users'),
    path('users/<int:pk>/', views.AdminUserDetailView.as_view(), name='user-detail'),
    path('proposals/', views.AdminProposalListView.as_view(), name='proposals'),
    path('proposals/<int:pk>/', views.AdminProposalDetailView.as_view(), name='proposal-detail'),
    path('skills/', views.AdminSkillListView.as_view(), name='skills'),
    path('skills/<int:pk>/', views.AdminSkillDetailView.as_view(), name='skill-detail'),
    path('notifications/', views.NotificationListCreateView.as_view(), name='notifications'),
]
