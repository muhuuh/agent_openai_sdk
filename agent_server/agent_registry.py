from agents import Agent, handoff
from tools.local_files import list_files, read_file
from tools.drive import list_drive_files, read_drive_file, upload_drive_file
from tools.gmail import list_recent_emails, read_emails, send_email

@handoff
def delegate_to_local_files_agent():
    return Agent(
        name="LocalFilesAgent",
        instructions="Handles local files.",
        tools=[list_files, read_file],
    )

@handoff
def delegate_to_google_services_agent():
    return Agent(
        name="GoogleServicesAgent",
        instructions="Handles Google Drive and Gmail.",
        tools=[
            list_drive_files,
            read_drive_file,
            upload_drive_file,
            list_recent_emails,
            read_emails,
            send_email,
        ],
    )

coordinator_agent = Agent(
    name="CoordinatorAgent",
    instructions="Routes requests to the correct sub-agent.",
    tools=[
        delegate_to_local_files_agent,
        delegate_to_google_services_agent,
    ]
)
