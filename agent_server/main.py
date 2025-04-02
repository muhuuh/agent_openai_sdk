import os
import openai
from agents import Agent, Runner, handoff
from tools.local_files import list_files, read_file
from tools.drive import list_drive_files, read_drive_file, upload_drive_file
from tools.gmail import list_recent_emails, read_emails, send_email

# Set your OpenRouter API key
openai.api_key = os.getenv("OPENROUTER_API_KEY")
openai.base_url = os.getenv("OPENROUTER_BASE_URL")

# Initialize the Local Files Agent
local_files_agent = Agent(
    name="LocalFilesAgent",
    instructions="Handles operations related to local file management.",
    tools=[list_files, read_file],
)

# Initialize the Google Services Agent
google_services_agent = Agent(
    name="GoogleServicesAgent",
    instructions="Manages Google Drive and Email operations.",
    tools=[list_drive_files, read_drive_file, upload_drive_file, list_recent_emails, read_emails, send_email],
)

# Coordinator Agent that delegates tasks
@handoff
def delegate_to_local_files_agent():
    return local_files_agent

@handoff
def delegate_to_google_services_agent():
    return google_services_agent

coordinator_agent = Agent(
    name="CoordinatorAgent",
    instructions="Delegates tasks to the appropriate agent based on the request.",
    tools=[delegate_to_local_files_agent, delegate_to_google_services_agent],
)

# Running the Coordinator Agent
if __name__ == "__main__":
    import asyncio
    asyncio.run(Runner.run(coordinator_agent))
