# AI Agent Assistant with MCP and Tool Calling

This project demonstrates an AI assistant application featuring a web-based chat interface (frontend) and a powerful backend leveraging a multi-coordinator pattern (MCP) with agent-based tool calling. The assistant can interact with various services like Google Drive, Gmail, Google Calendar, and a custom To-Do application via APIs.

## Project Structure

- `agent_frontend/`: Contains the Next.js frontend application.
  - `pages/`: Main application pages (chat, login, API keys).
  - `components/`: Reusable UI components.
  - `context/`: Authentication context.
  - `public/`: Static assets.
  - `.env.local`: Frontend environment variables.
- `agent_server/`: Contains the Python FastAPI backend server.
  - `agents/`: Agent definitions (using a library like `agent-openai-sdk` - assumed).
  - `tools/`: Python functions exposed as tools to the agents (e.g., `drive.py`, `gmail.py`, `todo.py`, `auth.py`).
  - `server.py`: FastAPI application setup, agent definitions, and API endpoints.
  - `.env`: Backend environment variables.
  - `credentials.json`: (User-generated) Google OAuth client secrets.
  - `token.json`: (Auto-generated) User-specific Google OAuth tokens (for local single-user setup).

## Features

- **Frontend:**
  - Chat interface for interacting with the AI assistant.
  - User authentication (Sign up, Login, Logout, Password Reset) via Supabase.
  - Secure API key management page (CRUD operations) for third-party services (like the To-Do app).
  - Protected routes requiring authentication.
- **Backend:**
  - FastAPI server handling agent requests.
  - Multi-Coordinator Pattern (MCP) using a `CoordinatorAgent` to delegate tasks to specialized agents.
  * Specialized agents for Google Services (Drive, Gmail, Calendar), local files, weather, and a To-Do app.
  * Tool calling mechanism allowing agents to execute specific Python functions.
  * Integration with Google APIs via OAuth 2.0.
  * Integration with a custom To-Do app API.
  * Secure API key retrieval from Supabase based on authenticated user.

## Prerequisites

- **Node.js and npm:** For the frontend (LTS version recommended).
- **Python:** For the backend (version 3.9+ recommended).
- **pip:** Python package installer.
- **Git:** For cloning the repository.
- **Google Account:** To enable Google API access.
- **(Optional) Supabase Account:** If using Supabase for authentication and API key storage.
- **(Optional) OpenRouter API Key:** The backend uses OpenRouter to access various LLMs.
- **(Optional) Custom To-Do App:** A running instance of the To-Do app with its API endpoint and API key mechanism.
- **(Optional) OpenWeatherMap API Key:** For the weather tool.

## Setup Instructions

Follow these steps to set up and run the project locally.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <repository-directory>
```

### 2. Backend Setup (`agent_server/`)

**(a) Navigate to Backend Directory:**

```bash
cd agent_server
```

**(b) Create Virtual Environment (Recommended):**

```bash
python -m venv venv
# Activate the environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

**(c) Install Python Dependencies:**

```bash
pip install -r requirements.txt
```

_(Note: If `requirements.txt` doesn't exist, you might need to create it based on the imports in the Python files, e.g., `pip install fastapi uvicorn python-dotenv openai requests google-api-python-client google-auth-oauthlib google-auth-httplib2 supabase pydantic`)_

**(d) Obtain Google OAuth Credentials (`credentials.json`):**

This is crucial for allowing the backend to access Google services _on your behalf_.

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a **new project** or select an existing one.
3.  Navigate to **APIs & Services -> Library**.
4.  Search for and **Enable** the following APIs:
    - Google Drive API
    - Gmail API
    - Google Calendar API
5.  Navigate to **APIs & Services -> OAuth consent screen**.
    - Choose **External** user type.
    - Fill in the required app information (App name, User support email, Developer contact information). You can keep it simple for local testing.
    - Add the necessary **Scopes** required by the application (copy them from `agent_server/tools/auth.py`, e.g., `https://www.googleapis.com/auth/drive`, `https://www.googleapis.com/auth/gmail.readonly`, etc.).
    - Add your Google account email address as a **Test user**.
6.  Navigate to **APIs & Services -> Credentials**.
    - Click **+ CREATE CREDENTIALS** -> **OAuth client ID**.
    - Select **Desktop app** as the Application type.
    - Give it a name (e.g., "AI Agent Local Desktop Client").
    - Click **Create**.
7.  A popup will show your Client ID and Client Secret. Click **DOWNLOAD JSON**.
8.  Rename the downloaded file to `credentials.json`.
9.  **VERY IMPORTANT:** Place this `credentials.json` file directly inside the `agent_server` directory.

**(e) Configure Backend Environment Variables (`.env`):**

1.  Create a file named `.env` in the `agent_server` directory.
2.  Add the following variables, replacing placeholder values with your actual keys/URLs:

    ```dotenv
    # Google Credentials Path (should match the file you placed)
    GOOGLE_CREDENTIALS_PATH=./credentials.json

    # OpenRouter Credentials (or OpenAI if configured differently)
    OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key
    OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
    # Optionally add OPENAI_API_KEY if needed by underlying libraries

    # Supabase Credentials (if using Supabase)
    # Use the SERVICE_ROLE_KEY for the backend - Keep this secure!
    SUPABASE_URL=https://your-supabase-project-url.supabase.co
    SUPABASE_KEY=your-supabase-service-role-key

    # Custom To-Do App URL (if using the todo tool)
    TODO_APP_URL=https://your-todo-app-api-base-url.com

    # OpenWeatherMap API Key (if using the weather tool)
    OPENWEATHER_API_KEY=your-openweathermap-api-key
    ```

**(f) Initial Google Authentication (`token.json` Generation):**

- The first time you run a command that requires Google access (e.g., asking the agent to list drive files), the backend will detect that `token.json` does not exist.
- It will automatically:
  - Use your `credentials.json`.
  - Open a web browser window.
  - Prompt you to log in to the Google account you added as a "Test user" in the Cloud Console.
  - Ask you to grant the permissions (scopes) you configured.
- After you grant permission, Google will redirect, and the script will capture the authorization.
- It will then create a `token.json` file in the `agent_server` directory. This file contains the tokens needed to access your Google account. **Do not share or commit `token.json`!**

### 3. Frontend Setup (`agent_frontend/`)

**(a) Navigate to Frontend Directory:**

```bash
# From the root directory:
cd agent_frontend
# Or from agent_server:
cd ../agent_frontend
```

**(b) Install Node.js Dependencies:**

```bash
npm install
```

**(c) Configure Frontend Environment Variables (`.env.local`):**

1.  Create a file named `.env.local` in the `agent_frontend` directory.
2.  Add the following variables, replacing placeholder values:

    ```dotenv
    # Supabase Credentials (for frontend authentication)
    # Use the ANON KEY for the frontend
    NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-url.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

### 4. Running the Application

You need to run both the backend and frontend servers concurrently.

**(a) Start the Backend Server:**

- Ensure you are in the `agent_server` directory and your virtual environment is activated.
- Run the FastAPI server using Uvicorn:

  ```bash
  uvicorn server:app --reload --port 8000
  ```

- Keep this terminal window open. Watch for any errors or the initial Google Auth flow if `token.json` isn't present.

**(b) Start the Frontend Server:**

- Open a **new** terminal window.
- Navigate to the `agent_frontend` directory.
- Run the Next.js development server:

  ```bash
  npm run dev
  ```

**(c) Access the Application:**

- Open your web browser and go to `http://localhost:3000` (or the port specified by Next.js).
- You should see the AI Assistant application. You can now sign up, log in, add API keys (if needed for the To-Do app), and interact with the chat assistant.

## Important Security Notes

- **NEVER commit `.env`, `.env.local`, `credentials.json`, or `token.json` files to Git.** Add them to your `.gitignore` file immediately if they aren't already there.
- The `SUPABASE_KEY` in the backend `.env` file is the **Service Role Key**. It bypasses RLS policies and should be treated like a root password for your database. Keep it highly secure.
- The setup described here using `token.json` is suitable only for **local, single-user development**. For a deployed, multi-user application, you **must** implement a database-backed OAuth token storage mechanism as described in advanced authentication guides.
