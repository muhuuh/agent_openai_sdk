# server.py
import sys, os, asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Windows subprocess workaround
if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

load_dotenv()
import openai
openai.api_key = os.getenv("OPENROUTER_API_KEY")
openai.base_url = os.getenv("OPENROUTER_BASE_URL")

from agents import Agent, Runner
from agents.mcp.server import MCPServerStdio

# stderr logger
def log(msg: str):
    print(f"[SERVER] {msg}", file=sys.stderr, flush=True)

# 1) MCP server
BASE_DIR = os.path.dirname(__file__)
weather_mcp = MCPServerStdio(
    params={
        "command": sys.executable,
        "args": [os.path.join(BASE_DIR, "mcp_servers", "weather_mcp.py")],
        "cwd": BASE_DIR,
    },
    cache_tools_list=True
)

# 2) Agents
from tools.local_files      import list_files, read_file
from tools.drive            import list_drive_files, read_drive_file, upload_drive_file
from tools.gmail            import list_recent_emails, read_emails, send_email
from tools.calendar         import list_calendar_events, list_pending_invitations, respond_to_invitation, create_calendar_event
from tools.weather          import get_weather, get_hourly_forecast, get_daily_forecast
from tools.todo             import create_todo_task

local_files_agent = Agent(
    name="LocalFilesAgent",
    instructions="Handles operations related to local file management.",
    tools=[list_files, read_file]
)
google_services_agent = Agent(
    name="GoogleServicesAgent",
    instructions="Manages Google Drive and email (Gmail provider) operations. Don't ask for permission to access and exceute tasks. Just do it.",
    tools=[list_drive_files, read_drive_file, upload_drive_file, list_recent_emails, read_emails, send_email]
)
google_calendar_agent = Agent(
    name="GoogleCalendarAgent",
    instructions="Manages Google Calendar operations, like checking schedules, responding to invites, and creating new events.",
    tools=[list_calendar_events, list_pending_invitations, respond_to_invitation, create_calendar_event]
)
day_to_day_agent = Agent(
    name="DayToDayAgent",
    instructions="Takes care of day to day related requests like weather forecast, news, etc.",
    mcp_servers=[weather_mcp]
)
todo_agent = Agent(
    name="TodoAgent",
    instructions="""
    Handles task management using the user's to-do app.
     When creating tasks:
     1. Always include all required parameters (main_task, sub_task, category, importance, bucket, time_estimate, user_id)
     2. For user_id, use the context's user_id value if available
     3. Importance should be one of: Low, Medium, High
     4. Bucket should be one of: Today, Tomorrow, Upcoming, Someday
     5. time_estimate should be in minutes (e.g., 60 for 1 hour)
     """,
    tools=[create_todo_task]
)

coordinator = Agent(
    name="CoordinatorAgent",
    instructions="You are a master coordinator. Delegate tasks to the correct agent based on user request.",    handoffs=[local_files_agent, google_services_agent, google_calendar_agent, day_to_day_agent, todo_agent]
)

# 3) FastAPI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

class Query(BaseModel):
    message: str
    user_id: Optional[str] = None

    @validator("user_id")
    def not_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError("user_id must be non-empty")
        return v

# 4) Keep MCP server up across requests
@app.on_event("startup")
async def startup_mcp():
    log("🚀 Starting MCP server…")
    await weather_mcp.__aenter__()

@app.on_event("shutdown")
async def shutdown_mcp():
    log("🛑 Shutting down MCP server…")
    await weather_mcp.__aexit__(None, None, None)

# 5) Single /query endpoint
@app.post("/query")
async def query_agent(q: Query):
    log(f"🔍 Incoming query: {q.message!r} (user_id={q.user_id!r})")
    try:
        log("📤 Calling Runner.run…")
        result = await Runner.run(
            coordinator,
            q.message,
            context={"user_id": q.user_id}
        )
        # extract text
        if hasattr(result, "final_output"):
            answer = result.final_output
        else:
            answer = str(result)
        log(f"🎯 Final answer: {answer!r}")

        return {"response": {"final_output": answer}}

    except Exception as e:
        log(f"❌ ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))
