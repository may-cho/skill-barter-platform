import os
import sys
import django

# Configuration
USERNAME = 'SkillBarterAdmin'
PASSWORD = 'Admin@123'

# Ensure backend is on path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

try:
    u = User.objects.get(username=USERNAME)
except User.DoesNotExist:
    print(f'User {USERNAME} not found')
    sys.exit(1)

pw_ok = u.check_password(PASSWORD)
print('Password match:', pw_ok)

if not pw_ok:
    print('Password does not match; will not change password automatically.')
    # If you want to reset password here, set u.set_password(PASSWORD) and u.save()
    # Exiting without making changes.
    sys.exit(1)

# Set is_admin (this will also set is_staff via model save())
u.is_admin = True
u.save()

print('Updated:', u.username, 'is_admin=', u.is_admin, 'is_staff=', u.is_staff, 'is_superuser=', u.is_superuser)
