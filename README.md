# AI Assistant Project with MCP Servers (Weather, Tools) and Dockerized Backend

This project demonstrates a full AI assistant system, featuring:
- Frontend chat interface (Next.js)
- Backend agent system (FastAPI + OpenAI Agents SDK)
- Third-party tool integration via **custom MCP servers** using **JSON-RPC over STDIO**
- Dockerized backend for easy deployment

---

# Project Structure

```plaintext
agent_frontend/     # Next.js frontend (chat UI)
agent_server/
├── server.py       # FastAPI server + agent coordinator
├── Dockerfile      # Dockerfile to containerize the backend
├── requirements.txt# Python dependencies
├── .env            # Backend environment variables
├── mcp_servers/    # Custom MCP servers (talking over STDIO)
│   └── weather_mcp.py
├── tools/          # In-process function tools (Google APIs, todo app)
│   ├── weather.py
│   ├── todo.py
│   └── (other tools like drive, gmail...)
```

---

# How it Works (Architecture)

```plaintext
User (Frontend / Chat UI)
   ↓ HTTP (POST /query)
Backend FastAPI (server.py)
   ↓ Runner.run() using OpenAI Agents SDK
      ├── CoordinatorAgent (decides which sub-agent)
      └── Child agent (DayToDayAgent, etc.)
         ├── Function tool (if local)
         └── MCP server (if weather, etc.) via STDIO + JSON-RPC
            ↓ weather_mcp.py subprocess
               ↓ weather.py functions (real API calls to OpenWeather)
```

---

# Key Concepts

- **STDIO communication**: The backend spawns `weather_mcp.py` as a subprocess and communicates with it via stdin/stdout (no HTTP server needed).
- **JSON-RPC framing**: We wrap every call in a `{ "method":..., "params":..., "id":... }` JSON envelope.
- **MCP Servers**: Modular way to integrate external or internal tools.
- **Docker**: Backend is containerized for easy launch.

---

# Setup Guide

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd agent_server
```

## 2. Configure Environment Variables

Create a `.env` file inside `agent_server/`:

```dotenv
OPENROUTER_API_KEY=sk-your-api-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-key
TODO_APP_URL=https://your-todo-app-url
OPENWEATHER_API_KEY=your-openweathermap-api-key
```

## 3. Build and Run the Backend with Docker

```bash
docker build -t agent_server .
docker run -p 8000:8000 --env-file .env agent_server
```

- FastAPI server will be available at `http://localhost:8000`
- MCP subprocess `weather_mcp.py` will be automatically spawned and managed

## 4. Frontend Setup (agent_frontend/)

Follow the existing instructions inside `agent_frontend/` to:
- Run `npm install`
- Configure `.env.local`
- Run `npm run dev`

Access the chat UI at `http://localhost:3000`

---

# Requirements

Backend (`requirements.txt`):

```plaintext
fastapi
uvicorn[standard]
openai
openai-agents
openai-agents-mcp
python-dotenv
requests
google-api-python-client
google-auth-oauthlib
google-auth-httplib2
supabase
```

---

# How to Add New MCP Servers

1. Create a new Python script inside `mcp_servers/`, following the `weather_mcp.py` pattern:
   - Expose your tools with name, description, inputSchema, outputSchema.
   - Implement `initialize`, `tools/list`, `tools/call`, and `shutdown` methods.

2. In `server.py`, create a new `MCPServerStdio()` for your new MCP server.

3. Attach it to the relevant agent (`mcp_servers=[your_mcp_server]`).

---

# Example: `weather_mcp.py` Responsibilities

- Implements JSON-RPC protocol over STDIO.
- Registers 3 tools:
  - `get_weather`
  - `get_hourly_forecast`
  - `get_daily_forecast`
- Maps each tool to real API logic defined in `tools/weather.py`.
- Handles:
  - `initialize`
  - `tools/list`
  - `tools/call`
  - `shutdown`

---

# Visual Diagram

```plaintext
   +----------------+                 +----------------+
   |  Frontend (UI)  |  → HTTP POST →  | FastAPI Server |
   +----------------+                 +----------------+
                                              |
                                       +-------------------+
                                       | Coordinator Agent |
                                       +-------------------+
                                               |
                         +---------------------+---------------------+
                         |                                           |
              +------------------+                       +------------------+
              | GoogleServiceAgent|                       | DayToDayAgent     |
              +------------------+                       +------------------+
                         |                                           |
            (function tools: Gmail, Drive)            (MCP Servers: Weather)
```

---

# Credits

Built using:
- OpenAI Agents SDK
- FastAPI
- OpenRouter
- Supabase
- Docker
- OpenWeather API

> A fully extensible modular AI agent system!
