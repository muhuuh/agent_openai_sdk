import os
import requests
from agents import function_tool
from dotenv import load_dotenv
from supabase import create_client, Client  # install with `pip install supabase`

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")  # AI assistant's Supabase project
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Service role key (used only server-side)
TODO_APP_URL = os.getenv("TODO_APP_URL")  # E.g., https://todo-organisor.vercel.app

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@function_tool
def create_todo_task(
    user_id: str,
    main_task: str,
    sub_task: str,
    category: str,
    importance: str,
    bucket: str,
    time_estimate: int
) -> str:
    """
    Create a task in the user's to-do app by calling its API.
    """
    # Look up the user's saved API key
    response = supabase.table("todo_api_keys").select("token").eq("user_id", user_id).single().execute()
    if response.error or not response.data:
        return "No API key found for the current user. Please connect your to-do app."

    token = response.data["token"]

    # Construct payload
    payload = {
        "main_task": main_task,
        "sub_task": sub_task,
        "category": category,
        "importance": importance,
        "bucket": bucket,
        "time_estimate": time_estimate
    }

    # Send request
    try:
        r = requests.post(
            f"{TODO_APP_URL}/api/new_tasks",
            json=payload,
            headers={"x-api-key": token}
        )

        if r.status_code != 200:
            return f"Failed to create task. API responded with: {r.text}"

        return "Task successfully created in your to-do app."
    except Exception as e:
        return f"Error calling to-do API: {str(e)}"
