import os
from agents import function_tool

@function_tool
def list_files(directory: str) -> list[str]:
    """List all files in a directory."""
    try:
        return os.listdir(directory)
    except Exception as e:
        return [str(e)]

@function_tool
def read_file(file_path: str) -> str:
    """Read a local file's content."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return str(e)
