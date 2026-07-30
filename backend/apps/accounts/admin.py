from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('bio', 'location', 'timezone', 'is_admin')}),
    )
    list_display = ('username', 'email', 'timezone', 'location', 'is_staff', 'is_admin')
