from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator
import os
import openai
from agents import Agent, Runner
#from agents import RemoteTool
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input structure for the /query route
class Query(BaseModel):
    message: str
    user_id: Optional[str] = None
    
    @validator('user_id')
    def validate_user_id(cls, v):
        if v is not None and (not isinstance(v, str) or v.strip() == ''):
            raise ValueError('user_id must be a non-empty string if provided')
        return v

# Define sub-agents directly (no @handoff)
local_files_agent = Agent(
    name="LocalFilesAgent",
    instructions="Handles operations related to local file management.",
    tools=[list_files, read_file],
)

google_services_agent = Agent(
    name="GoogleServicesAgent",
    instructions="Manages Google Drive and email operations. Don't ask for permission to access and exceute tasks. Just do it.",
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
    instructions="""Handles task management using the user's to-do app.
    When creating tasks:
    1. Always include all required parameters (main_task, sub_task, category, importance, bucket, time_estimate, user_id)
    2. For user_id, use the context's user_id value if available
    3. Importance should be one of: Low, Medium, High
    4. Bucket should be one of: Today, Tomorrow, Upcoming, Someday
    5. time_estimate should be in minutes (e.g., 60 for 1 hour)
    """,
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
        print(f"[SERVER DEBUG] User ID: {query.user_id or 'Not provided'}")
        
        # Create context with comprehensive debug information
        context = {}
        if query.user_id:
            context["user_id"] = query.user_id
            # Add a global user_id that's more prominently displayed
            os.environ["CURRENT_USER_ID"] = query.user_id
            print(f"[SERVER DEBUG] Added user_id to context: {query.user_id}")
            print(f"[SERVER DEBUG] Also set CURRENT_USER_ID environment variable")
        else:
            print("[SERVER WARN] No user_id provided in request - some functionality will not work")
            if "CURRENT_USER_ID" in os.environ:
                del os.environ["CURRENT_USER_ID"]
        
        # Add debug info about the environment
        print(f"[SERVER DEBUG] Active environment variables:")
        for key in ["SUPABASE_URL", "TODO_APP_URL"]:
            if key in os.environ:
                value = os.environ[key]
                print(f"  - {key}: {'set (not shown)' if 'KEY' in key else value}")
        
        response = await Runner.run(coordinator_agent, query.message, context=context)
        print(f"[SERVER DEBUG] Agent response: {response}")
        return {"response": response}
    except ValueError as e:
        # Handle validation errors
        print(f"[SERVER ERROR] Validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        print(f"[SERVER ERROR] Exception: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
