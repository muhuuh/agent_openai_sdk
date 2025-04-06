import os
import requests
from agents import function_tool
from dotenv import load_dotenv
from supabase import create_client, Client  # install with `pip install supabase`
import json

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")  # AI assistant's Supabase project
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Service role key (used only server-side)
TODO_APP_URL = os.getenv("TODO_APP_URL")  # E.g., https://todo-organisor.vercel.app

# Add debug prints for environment variables
print(f"[TODO DEBUG] SUPABASE_URL: {'set' if SUPABASE_URL else 'not set'}")
print(f"[TODO DEBUG] SUPABASE_KEY: {'set' if SUPABASE_KEY else 'not set'}")
print(f"[TODO DEBUG] TODO_APP_URL: {TODO_APP_URL}")

# Initialize Supabase client with error handling
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("[TODO DEBUG] Supabase client initialized successfully")
except Exception as e:
    print(f"[TODO ERROR] Failed to initialize Supabase client: {str(e)}")
    supabase = None

@function_tool
def create_todo_task(
    main_task: str,
    sub_task: str,
    category: str,
    importance: str,
    bucket: str,
    time_estimate: int,
    user_id: str
) -> str:
    """
    Create a task in the user's to-do app by calling its API.
    
    Args:
        main_task: The main task description (required)
        sub_task: Optional subtask or additional details
        category: Task category (e.g., work, personal, errands)
        importance: Priority level (Low, Medium, High)
        bucket: When the task should be done (Today, Tomorrow, Upcoming, Someday)
        time_estimate: Estimated time in minutes
        user_id: User ID (will use authenticated user if empty)
    """
    # Apply default values for empty strings
    sub_task = sub_task if sub_task else ""
    category = category if category else "general"
    importance = importance if importance else "Medium"
    bucket = bucket if bucket else "Today"
    time_estimate = time_estimate if time_estimate else 60
    
    # If user_id is empty, try to get from environment
    if not user_id or user_id.strip() == "":
        env_user_id = os.environ.get("CURRENT_USER_ID")
        if env_user_id:
            user_id = env_user_id
            print(f"[TODO DEBUG] Using CURRENT_USER_ID from environment: {user_id}")
        else:
            return "Error: No user ID provided. Please ensure you are logged in."
    
    print(f"[TODO DEBUG] create_todo_task called with user_id: {user_id}")
    
    if not supabase:
        return "Error: Unable to connect to the database. Please check server configuration."
    
    # Look up the user's saved API key
    try:
        print(f"[TODO DEBUG] Querying todo_api_keys table for user_id: {user_id}")
        response = supabase.table("todo_api_keys").select("token").eq("user_id", user_id).execute()
        
        print(f"[TODO DEBUG] API key query response: {json.dumps(response.dict(), default=str, indent=2)}")
        
        # Check if data exists and is not empty
        if not response.data or len(response.data) == 0:
            return "No API key found for your account. Please add an API key in the API Keys management page."
        
        # Use the first API key found
        token = response.data[0]["token"]
        print(f"[TODO DEBUG] Found API key: {token[:5]}...{token[-5:] if len(token) > 10 else ''}")
    except Exception as e:
        print(f"[TODO ERROR] Exception when fetching API key: {str(e)}")
        return f"Error retrieving API key: {str(e)}"

    # Construct payload
    payload = {
        "user_id": user_id,
        "main_task": main_task,
        "sub_task": sub_task,
        "category": category,
        "importance": importance,
        "bucket": bucket,
        "time_estimate": time_estimate
    }
    
    print(f"[TODO DEBUG] Sending request to {TODO_APP_URL}/api/new_tasks")
    print(f"[TODO DEBUG] Payload: {json.dumps(payload, indent=2)}")

    # Send request
    try:
        if not TODO_APP_URL:
            return "Error: TODO_APP_URL is not configured in the server environment."
            
        r = requests.post(
            f"{TODO_APP_URL}/api/new_tasks",
            json=payload,
            headers={"x-api-key": token}
        )
        
        print(f"[TODO DEBUG] Response status: {r.status_code}")
        print(f"[TODO DEBUG] Response body: {r.text[:500]}")  # Limit output length

        if r.status_code == 200:
            return "Task successfully created in your to-do app."
        else:
            return f"Failed to create task. API responded with: HTTP {r.status_code} - {r.text}"
    except requests.RequestException as e:
        print(f"[TODO ERROR] Request exception: {str(e)}")
        return f"Error calling to-do API: {str(e)}"
    except Exception as e:
        print(f"[TODO ERROR] Unexpected exception: {str(e)}")
        return f"Unexpected error: {str(e)}"
