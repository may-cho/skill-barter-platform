from django.contrib import admin

from .models import Skill


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'type', 'category', 'experience_level')
    list_filter = ('type', 'category', 'experience_level')
