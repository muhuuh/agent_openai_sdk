from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import openai
from agents import Agent, Runner
#from agents import RemoteTool

from dotenv import load_dotenv
load_dotenv()

# Import your tools
from tools.local_files import list_files, read_file
from tools.drive import list_drive_files, read_drive_file, upload_drive_file
from tools.gmail import list_recent_emails, read_emails, send_email
from tools.calendar import list_calendar_events, list_pending_invitations, respond_to_invitation, create_calendar_event
from tools.weather import get_weather, get_hourly_forecast, get_daily_forecast
from tools.todo import create_todo_task
# Set OpenRouter credentials
openai.api_key = os.getenv("OPENROUTER_API_KEY")
openai.base_url = os.getenv("OPENROUTER_BASE_URL")

app = FastAPI()

# Input structure for the /query route
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
    instructions="Manages Google Drive and Gmail operations. Don't ask for permission to access and exceute tasks. Just do it.",
    tools=[
        list_drive_files,
        read_drive_file,
        upload_drive_file,
        list_recent_emails,
        read_emails,
        send_email,
    ],
)

google_calendar_agent = Agent(
    name="GoogleCalendarAgent",
    instructions="Manages Google Calendar operations, like checking schedules, responding to invites, and creating new events.",
    tools=[
        list_calendar_events,
        list_pending_invitations,
        respond_to_invitation,
        create_calendar_event,
    ],
)

day_to_day_agent = Agent(
    name="DayToDayAgent",
    instructions="Takes care of day to day related requests like weather forecast, news, etc.",
    tools=[
        get_weather,
        get_hourly_forecast,
        get_daily_forecast,
    ],
)

todo_agent = Agent(
    name="TodoAgent",
    instructions="Handles task management using the user's to-do app.",
    tools=[create_todo_task]
)

# Coordinator Agent
coordinator_agent = Agent(
    name="CoordinatorAgent",
    instructions="You are a master coordinator. Delegate tasks to the correct agent based on user request.",
    # Use the 'handoffs' parameter for agent delegation
    handoffs=[
        local_files_agent,
        google_services_agent,
        google_calendar_agent,
        day_to_day_agent,
        todo_agent,
    ],
    tools=[] # Coordinator might not need direct tools if just delegating
)

# FastAPI route to handle agent calls
@app.post("/query")
async def query_agent(query: Query):
    try:
        print(f"[SERVER DEBUG] Incoming query: {query.message}")
        response = await Runner.run(coordinator_agent, query.message)
        print(f"[SERVER DEBUG] Agent response: {response}")
        return {"response": response}
    except Exception as e:
        print(f"[SERVER ERROR] Exception: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
