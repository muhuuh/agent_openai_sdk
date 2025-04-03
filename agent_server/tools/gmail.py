import base64
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from agents import function_tool
from tools.auth import get_gmail_service

@function_tool
def list_recent_emails(max_results: int) -> list[dict]:
    """Lists recent emails from the user's Gmail account."""
    gmail = get_gmail_service()
    results = gmail.users().messages().list(userId="me", maxResults=max_results).execute()
    messages = results.get("messages", [])

    output = []
    for msg in messages:
        msg_data = gmail.users().messages().get(userId="me", id=msg["id"], format="metadata", metadataHeaders=["From", "Subject", "Date"]).execute()
        headers = {h["name"]: h["value"] for h in msg_data["payload"]["headers"]}
        output.append({
            "from": headers.get("From"),
            "subject": headers.get("Subject"),
            "date": headers.get("Date")
        })
    return output

@function_tool
def read_emails(max_results: int, sender: str = None, since_days: int = None) -> list[dict]:
    """Reads emails from the user's Gmail account, optionally filtering by sender and time."""
    gmail = get_gmail_service()
    query_parts = []
    if sender:
        query_parts.append(f"from:{sender}")
    if since_days:
        since = (datetime.utcnow() - timedelta(days=since_days)).strftime("%Y/%m/%d")
        query_parts.append(f"after:{since}")
    query = " ".join(query_parts)

    results = gmail.users().messages().list(userId="me", q=query, maxResults=max_results).execute()
    messages = results.get("messages", [])

    emails = []
    for msg in messages:
        msg_data = gmail.users().messages().get(userId="me", id=msg["id"], format="full").execute()
        snippet = msg_data.get("snippet", "")
        headers = {h["name"]: h["value"] for h in msg_data["payload"]["headers"]}
        emails.append({
            "from": headers.get("From"),
            "subject": headers.get("Subject"),
            "date": headers.get("Date"),
            "snippet": snippet
        })
    return emails

@function_tool
def send_email(to: str, subject: str, body: str) -> str:
    """Sends an email using the user's Gmail account."""
    gmail = get_gmail_service()
    message = MIMEText(body)
    message["to"] = to
    message["subject"] = subject
    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
    gmail.users().messages().send(userId="me", body={"raw": raw_message}).execute()
    return "Email sent successfully."
