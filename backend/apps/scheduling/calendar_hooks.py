"""Google Calendar API sync hooks — implement when credentials are configured."""

from django.conf import settings


def sync_appointment_to_google_calendar(appointment):
    """
    Placeholder for Google Calendar API integration.
    When GOOGLE_CALENDAR_CLIENT_ID is set, create/update calendar events here.
    """
    if not settings.GOOGLE_CALENDAR_CLIENT_ID:
        return None

    # TODO: Implement OAuth2 flow and Calendar API v3 event creation
    # event = {
    #     'summary': f'Skill Barter Session - Proposal #{appointment.proposal_id}',
    #     'start': {'dateTime': appointment.scheduled_time.isoformat(), 'timeZone': 'UTC'},
    #     'end': {...},
    # }
    return None
