from agents import function_tool
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import os, io
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.http import MediaIoBaseDownload

SCOPES = ["https://www.googleapis.com/auth/drive"]
CREDENTIALS_PATH = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")

def get_drive_service():
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    else:
        flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
        creds = flow.run_local_server(port=0)
        with open("token.json", "w") as token:
            token.write(creds.to_json())
    return build("drive", "v3", credentials=creds)

@function_tool
def list_drive_files(folder_name: str = None) -> list[str]:
    service = get_drive_service()
    query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder'" if folder_name else None
    results = service.files().list(q=query, pageSize=10, fields="files(id, name)").execute()
    return [f["name"] for f in results.get("files", [])]



