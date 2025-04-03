import datetime
import os
from agents import function_tool
from tools.auth import get_calendar_service
from googleapiclient.errors import HttpError

# Helper to format datetime objects for the API
def _format_datetime(dt):
    return dt.isoformat() + 'Z' # 'Z' indicates UTC time

@function_tool
def list_calendar_events(start_days_from_now: int, end_days_from_now: int) -> list[dict]:
    """Lists events from the user's primary Google Calendar within a specified time range.
    Args:
        start_days_from_now: The starting day offset from today (e.g., 0 for today, 1 for tomorrow).
        end_days_from_now: The ending day offset from today (e.g., 1 for today, 7 for the next week).
    """
    # Apply defaults internally if needed, or rely on LLM to provide based on description
    # For simplicity, we'll assume the LLM provides them for now.
    service = get_calendar_service()
    now = datetime.datetime.utcnow()
    time_min = _format_datetime(now + datetime.timedelta(days=start_days_from_now))
    time_max = _format_datetime(now + datetime.timedelta(days=end_days_from_now))

    print(f"Fetching events from {time_min} to {time_max}")
    try:
        events_result = service.events().list(
            calendarId='primary', timeMin=time_min, timeMax=time_max,
            maxResults=50, singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])

        if not events:
            return [{"info": "No upcoming events found in the specified range."}]

        output = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            output.append({
                "summary": event.get('summary', 'No Title'),
                "start": start,
                "end": end,
                "description": event.get('description', 'No Description'),
                "id": event['id'] # Include event ID for potential follow-up actions
            })
        return output
    except HttpError as error:
        print(f"An error occurred: {error}")
        return [{"error": f"Failed to fetch calendar events: {error}"}]
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return [{"error": f"An unexpected error occurred: {e}"}]


@function_tool
def list_pending_invitations() -> list[dict]:
    """Lists events the user is invited to but hasn't responded to yet."""
    service = get_calendar_service()
    now = datetime.datetime.utcnow().isoformat() + 'Z' # 'Z' indicates UTC time
    print("Fetching pending invitations...")
    try:
        events_result = service.events().list(
            calendarId='primary',
            showDeleted=False,
            singleEvents=True,
            maxResults=50,
            orderBy='startTime',
            timeMin=now, # Only show future or ongoing invitations
            # q='invitationStatus=needsAction' # This filter doesn't work reliably via list
        ).execute()
        events = events_result.get('items', [])

        pending_invitations = []
        user_email = service.calendarList().get(calendarId='primary').execute().get('id') # Get user's primary calendar email

        if not user_email:
            print("Could not determine primary calendar user email.")
            return [{"error": "Could not determine primary calendar user email."}]

        for event in events:
            attendees = event.get('attendees', [])
            for attendee in attendees:
                # Check if the attendee is the user and their response is 'needsAction'
                if attendee.get('self', False) and attendee.get('responseStatus') == 'needsAction': # Use 'self' field if available
                    start = event['start'].get('dateTime', event['start'].get('date'))
                    pending_invitations.append({
                        "summary": event.get('summary', 'No Title'),
                        "start": start,
                        "organizer": event.get('organizer', {}).get('email', 'Unknown Organizer'),
                        "id": event['id']
                    })
                    break # Move to the next event once the user's pending status is confirmed
                # Fallback if 'self' field isn't present (less reliable)
                elif attendee.get('email') == user_email and attendee.get('responseStatus') == 'needsAction':
                    start = event['start'].get('dateTime', event['start'].get('date'))
                    pending_invitations.append({
                        "summary": event.get('summary', 'No Title'),
                        "start": start,
                        "organizer": event.get('organizer', {}).get('email', 'Unknown Organizer'),
                        "id": event['id']
                    })
                    break

        if not pending_invitations:
            return [{"info": "No pending invitations found."}]

        return pending_invitations
    except HttpError as error:
        print(f"An error occurred: {error}")
        return [{"error": f"Failed to fetch pending invitations: {error}"}]
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return [{"error": f"An unexpected error occurred: {e}"}]


@function_tool
def respond_to_invitation(event_id: str, response: str) -> dict:
    """Responds to a specific event invitation. Response must be 'accepted', 'declined', or 'tentative'."""
    service = get_calendar_service()
    valid_responses = ['accepted', 'declined', 'tentative']
    response_lower = response.lower()
    if response_lower not in valid_responses:
        return {"error": f"Invalid response. Must be one of: {', '.join(valid_responses)}"}

    try:
        # Get the event to ensure it exists and to get current attendees
        event = service.events().get(calendarId='primary', eventId=event_id).execute()

        # Find the current user's attendee record based on the 'self' field if available
        user_attendee_found = False
        attendees = event.get('attendees', [])
        for attendee in attendees:
            if attendee.get('self', False):
                attendee['responseStatus'] = response_lower
                user_attendee_found = True
                break

        # Fallback: If 'self' field is not present, find by email (less reliable)
        if not user_attendee_found:
            user_email = service.calendarList().get(calendarId='primary').execute().get('id')
            if not user_email:
                 return {"error": "Could not determine primary calendar user email to update status."}
            for attendee in attendees:
                 if attendee.get('email') == user_email:
                    attendee['responseStatus'] = response_lower
                    user_attendee_found = True
                    break

        if not user_attendee_found:
            return {"error": "Could not find your attendee record for this event, or you might not be an attendee."}

        # Update the event with the modified attendee list
        # Crucially, sendUpdates='all' notifies other attendees
        updated_event = service.events().update(
            calendarId='primary',
            eventId=event_id,
            body={'attendees': attendees}, # Only send updated attendees
            sendUpdates='all'
        ).execute()

        return {"success": f"Successfully responded '{response_lower}' to event '{updated_event.get('summary', event_id)}'."}

    except HttpError as error:
        print(f"An error occurred: {error}")
        if error.resp.status == 404:
             return {"error": f"Event with ID '{event_id}' not found."}
        elif error.resp.status == 403:
             return {"error": f"Permission denied. You might not have rights to modify this event or respond."}
        return {"error": f"Failed to respond to invitation: {error}"}
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {"error": f"An unexpected error occurred: {e}"} 