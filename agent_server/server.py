# server.py
import sys, asyncio, os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Force Proactor on Windows (so that subprocess pipes work)
if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

load_dotenv()
import openai
openai.api_key = os.getenv("OPENROUTER_API_KEY")
openai.base_url = os.getenv("OPENROUTER_BASE_URL")

from agents import Agent, Runner
from agents.mcp.server import MCPServerStdio

# === DEBUG LOGGER ===
def log(msg: str):
    print(f"[SERVER] {msg}", file=sys.stderr, flush=True)

# --- define your MCPServerStdio ---
BASE = os.path.dirname(__file__)
weather_mcp = MCPServerStdio(
    params={
        "command": sys.executable,
        "args": [os.path.join(BASE, "weather_mcp.py")],
        "cwd": BASE,
    },
    cache_tools_list=True
)

# --- define your agents ---
from tools.local_files import list_files, read_file
from tools.drive       import list_drive_files, read_drive_file, upload_drive_file
from tools.gmail       import list_recent_emails, read_emails, send_email
from tools.calendar    import list_calendar_events, list_pending_invitations, respond_to_invitation, create_calendar_event
from tools.weather     import get_weather, get_hourly_forecast, get_daily_forecast
from tools.todo        import create_todo_task

local_files_agent = Agent(
    name="Local",
    instructions="File ops",
    tools=[list_files, read_file]
)

day_to_day_agent = Agent(
    name="DayToDay",
    instructions="Weather, news, etc.",
    mcp_servers=[weather_mcp]
)

todo_agent = Agent(
    name="Todo",
    instructions="To‑do tasks",
    tools=[create_todo_task]
)

coordinator = Agent(
    name="Coordinator",
    instructions="Route requests",
    handoffs=[local_files_agent, day_to_day_agent, todo_agent],
)

# --- FastAPI boilerplate ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class Query(BaseModel):
    message: str
    user_id: Optional[str] = None

    @validator("user_id")
    def not_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError("user_id must be non-empty")
        return v

@app.post("/query")
async def query_agent(q: Query):
    log(f"Incoming query: {q.message!r}, user_id={q.user_id!r}")
    try:
        # spin up the MCP subprocess and do the handshake
        log("⏳ Starting MCP server for weather...")
        async with weather_mcp:
            log("✅ MCP server ready—calling Runner.run")
            result = await Runner.run(
                coordinator,
                q.message,
                context={"user_id": q.user_id}
            )
            log(f"🎉 Runner result: {result!r}")
        return {"response": result}
    except Exception as e:
        log(f"❌ ERROR during agent run: {e}")
        raise HTTPException(500, str(e))
