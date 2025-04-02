from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import openai
from agents import Agent, Runner
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ✅ Import your tools
from tools.local_files import list_files, read_file
from tools.drive import list_drive_files, read_drive_file, upload_drive_file
from tools.gmail import list_recent_emails, read_emails, send_email

# ✅ Set OpenRouter credentials
openai.api_key = os.getenv("OPENROUTER_API_KEY")
openai.base_url = os.getenv("OPENROUTER_BASE_URL")

app = FastAPI()

# ✅ Input structure for the /query route
class Query(BaseModel):
    message: str

# Define sub-agents directly (no @handoff)
local_files_agent = Agent(
    name="LocalFilesAgent",
    instructions="Handles operations related to local file management.",
    tools=[list_files, read_file],
)

google_services_agent = Agent(
    name="GoogleServicesAgent",
    instructions="Manages Google Drive and Gmail operations.",
    tools=[
        list_drive_files,
        read_drive_file,
        upload_drive_file,
        list_recent_emails,
        read_emails,
        send_email,
    ],
)

# ✅ Coordinator Agent
coordinator_agent = Agent(
    name="CoordinatorAgent",
    instructions="You are a master coordinator. Delegate tasks to the correct agent based on user request.",
    # Use the 'handoffs' parameter for agent delegation
    handoffs=[
        local_files_agent,
        google_services_agent,
    ],
    tools=[] # Coordinator might not need direct tools if just delegating
)

# ✅ FastAPI route to handle agent calls
@app.post("/query")
async def query_agent(query: Query):
    try:
        response = await Runner.run(coordinator_agent, query.message)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
