import os
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

load_dotenv()

SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/calendar'
]

CREDENTIALS_PATH = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")
TOKEN_PATH = "token.json" # Define token path constant

def _get_google_credentials():
    """Gets valid Google credentials, initiating OAuth flow if needed."""
    creds = None
    # Load existing token if it exists
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"Error refreshing token: {e}. Initiating full auth flow.")
                creds = None # Force re-authentication
        
        # Only run the flow if refresh failed or no valid creds
        if not creds or not creds.valid: 
            print(f"No valid credentials found at {TOKEN_PATH}. Initiating OAuth flow...")
            print(f"Using credentials file: {CREDENTIALS_PATH}")
            if not os.path.exists(CREDENTIALS_PATH):
                 raise FileNotFoundError(f"Credentials file not found at {CREDENTIALS_PATH}. Please ensure it's correctly placed and the path is set in .env")
            
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
            # Important: run_local_server() opens the browser for user consent
            creds = flow.run_local_server(port=0) 
            print("OAuth flow completed. Credentials obtained.")
        
        # Save the credentials for the next run
        print(f"Saving credentials to {TOKEN_PATH}")
        with open(TOKEN_PATH, "w") as token:
            token.write(creds.to_json())
    else:
        print(f"Loaded valid credentials from {TOKEN_PATH}")

    return creds

def get_drive_service():
    """Builds and returns a Google Drive service client."""
    creds = _get_google_credentials()
    return build("drive", "v3", credentials=creds)

def get_gmail_service():
    """Builds and returns a Gmail service client."""
    creds = _get_google_credentials()
    return build("gmail", "v1", credentials=creds)

def get_calendar_service():
    """Builds and returns a Google Calendar service client."""
    creds = _get_google_credentials()
    return build("calendar", "v3", credentials=creds)
