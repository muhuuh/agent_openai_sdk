from agents import Agent, Runner
from tools.drive import list_drive_files
from tools.gmail import read_emails, send_email
from tools.local_files import list_files, read_file

my_agent = Agent(
    name="MySuperAgent",
    instructions="You are an assistant that can manage emails, files, and documents.",
    tools=[list_drive_files, read_emails, send_email, list_files, read_file],
)

if __name__ == "__main__":
    import asyncio
    asyncio.run(Runner.run(my_agent))
