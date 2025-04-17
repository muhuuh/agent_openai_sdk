#!/usr/bin/env python3
import sys
import json
from tools.weather import get_weather, get_hourly_forecast, get_daily_forecast

# Define each tool’s metadata per MCP spec
TOOLS = {
    "get_weather": {
        "description": "Get the current weather for a specified city using the free OpenWeatherMap API.",
        "arguments": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name"}
            },
            "required": ["city"]
        },
        "func": get_weather
    },
    "get_hourly_forecast": {
        "description": "Get hourly weather forecast up to 48 hours.",
        "arguments": {
            "type": "object",
            "properties": {
                "city": {"type": "string"},
                "hours": {"type": "integer"}
            },
            "required": ["city", "hours"]
        },
        "func": get_hourly_forecast
    },
    "get_daily_forecast": {
        "description": "Get daily weather forecast up to 7 days",
        "arguments": {
            "type": "object",
            "properties": {
                "city": {"type": "string"},
                "days": {"type": "integer"}
            },
            "required": ["city", "days"]
        },
        "func": get_daily_forecast
    }
}

def send(obj):
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()

for line in sys.stdin:
    msg = json.loads(line)
    t = msg.get("type")
    if t == "list_tools":
        send({ "type": "tools_list",
               "tools": [
                   {"name": n,
                    "description": TOOLS[n]["description"],
                    "arguments": TOOLS[n]["arguments"]}
                   for n in TOOLS
               ]})
    elif t == "call_tool":
        name = msg["tool_name"]
        args = msg.get("arguments", {}) or {}
        try:
            result = TOOLS[name]["func"](**args)
            send({ "type": "tool_result",
                   "tool_name": name,
                   "result": result })
        except Exception as e:
            send({ "type": "tool_error",
                   "tool_name": name,
                   "error": str(e) })
