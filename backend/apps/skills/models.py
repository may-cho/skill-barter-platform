from django.conf import settings
from django.db import models


class SkillType(models.TextChoices):
    TEACH = 'teach', 'Teach'
    LEARN = 'learn', 'Learn'


class SkillLevel(models.TextChoices):
    BEGINNER = 'Beginner', 'Beginner'
    INTERMEDIATE = 'Intermediate', 'Intermediate'
    EXPERT = 'Expert', 'Expert'


class SkillCategory(models.TextChoices):
    PROGRAMMING = 'Programming', 'Programming'
    LANGUAGES = 'Languages', 'Languages'
    MUSIC = 'Music', 'Music'
    HEALTH_FITNESS = 'Health & Fitness', 'Health & Fitness'
    ARTS = 'Arts', 'Arts'
    BUSINESS = 'Business', 'Business'
    OTHER = 'Other', 'Other'


class Skill(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='skills',
    )
    type = models.CharField(max_length=10, choices=SkillType.choices)
    category = models.CharField(max_length=100, choices=SkillCategory.choices)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    experience_level = models.CharField(max_length=20, choices=SkillLevel.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'skills'
        indexes = [
            models.Index(fields=['user', 'type', 'category'], name='idx_skills_lookup'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.get_type_display()})'
