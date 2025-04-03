import io
from agents import function_tool
from tools.auth import get_drive_service
from googleapiclient.http import MediaIoBaseDownload, MediaFileUpload

def get_drive_file_id_by_name(service, name, parent_folder_id=None):
    query = f"name = '{name}'"
    if parent_folder_id:
        query += f" and '{parent_folder_id}' in parents"
    results = service.files().list(q=query, spaces='drive', fields="files(id, name)", pageSize=1).execute()
    files = results.get("files", [])
    return files[0]["id"] if files else None

@function_tool
def list_drive_files(folder_name: str) -> list[dict]:
    """Lists files within a specified Google Drive folder."""
    service = get_drive_service()
    folder_id = get_drive_file_id_by_name(service, folder_name) if folder_name else None
    query = f"'{folder_id}' in parents" if folder_id else None
    results = service.files().list(q=query, pageSize=10, fields="files(id, name)").execute()
    return results.get("files", [])

@function_tool
def read_drive_file(file_name: str, folder_name: str) -> str:
    """Reads the content of a specified file from Google Drive."""
    service = get_drive_service()
    folder_id = get_drive_file_id_by_name(service, folder_name) if folder_name else None
    file_id = get_drive_file_id_by_name(service, file_name, parent_folder_id=folder_id)
    if not file_id:
        return f"File '{file_name}' not found."

    file_metadata = service.files().get(fileId=file_id, fields="mimeType").execute()
    mime_type = file_metadata["mimeType"]

    if mime_type == "application/vnd.google-apps.document":
        request = service.files().export_media(fileId=file_id, mimeType="text/plain")
    else:
        request = service.files().get_media(fileId=file_id)

    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    fh.seek(0)
    return fh.read().decode("utf-8")

@function_tool
def upload_drive_file(file_path: str, drive_filename: str) -> str:
    """Uploads a local file to Google Drive with a specified name."""
    service = get_drive_service()
    media = MediaFileUpload(file_path, resumable=True)
    file_metadata = {"name": drive_filename}
    file = service.files().create(body=file_metadata, media_body=media, fields="id").execute()
    return f"Uploaded successfully with ID: {file['id']}"
