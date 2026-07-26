import os
import sys
import django

# Ensure backend is on path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

users = User.objects.all()[:20]
if not users:
    print('No users found')
else:
    for u in users:
        print(u.username, getattr(u, 'is_admin', None), u.is_staff, u.is_superuser)
