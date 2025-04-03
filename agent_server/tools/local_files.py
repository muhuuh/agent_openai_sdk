import os
from agents import function_tool

@function_tool
def list_files(directory: str) -> list[str]:
    """Lists all files and directories within a specified local directory."""
    try:
        return os.listdir(directory)
    except Exception as e:
        return [str(e)]

@function_tool
def read_file(file_path: str) -> str:
    """Reads the content of a specified local file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return str(e)
