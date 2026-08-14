from django.contrib import admin

from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'proposal', 'sender', 'created_at')
    list_filter = ('created_at',)
