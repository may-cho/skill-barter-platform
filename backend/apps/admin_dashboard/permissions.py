from rest_framework import permissions


class IsAdminOrStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (getattr(user, 'is_admin', False) or user.is_staff or user.is_superuser))
