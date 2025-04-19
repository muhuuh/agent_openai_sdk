#!/usr/bin/env python3
import sys, json
from tools.weather import get_weather, get_hourly_forecast, get_daily_forecast

# === DEBUG LOGGER ===
def log(msg: str):
    sys.stderr.write(f"[MCP] {msg}\n")
    sys.stderr.flush()

log("Starting weather_mcp…")

# Tool registry
TOOLS = {
    "get_weather": {
        "description": "Get the current weather for a specified city.",
        "inputSchema": {
            "type": "object",
            "properties": {"city": {"type": "string"}},
            "required": ["city"]
        },
        "outputSchema": {"type": "string"},
        "func": get_weather
    },
    "get_hourly_forecast": {
        "description": "Get hourly forecast up to 48 hours.",
        "inputSchema": {
            "type": "object",
            "properties": {"city": {"type": "string"}, "hours": {"type": "integer"}},
            "required": ["city", "hours"]
        },
        "outputSchema": {"type": "string"},
        "func": get_hourly_forecast
    },
    "get_daily_forecast": {
        "description": "Get daily forecast up to 7 days.",
        "inputSchema": {
            "type": "object",
            "properties": {"city": {"type": "string"}, "days": {"type": "integer"}},
            "required": ["city", "days"]
        },
        "outputSchema": {"type": "string"},
        "func": get_daily_forecast
    }
}

def send_response(req_id, result=None, error=None):
    resp = {"jsonrpc": "2.0", "id": req_id}
    if error is not None:
        resp["error"] = {"message": error}
        log(f"Responding with error id={req_id}: {error}")
    else:
        resp["result"] = result
        log(f"Responding with result id={req_id}: {result!r}")
    sys.stdout.write(json.dumps(resp) + "\n")
    sys.stdout.flush()

# Main JSON-RPC loop
for line in sys.stdin:
    try:
        req = json.loads(line)
    except json.JSONDecodeError:
        log("Skipping invalid JSON line")
        continue

    method = req.get("method")
    req_id = req.get("id")
    params = req.get("params", {})
    log(f"Received method={method!r}, id={req_id}, params={params}")

    if method == "initialize":
        protocol_version = params.get("protocolVersion", "")
        capabilities     = params.get("capabilities", {})
        server_info      = {"name": "weather_mcp", "version": "0.1.0"}
        init_res = {
            "protocolVersion": protocol_version,
            "capabilities":    capabilities,
            "serverInfo":      server_info
        }
        send_response(req_id, init_res)

    elif method == "notifications/initialized":
        log("notifications/initialized received; no response needed.")

    elif method == "tools/list":
        tools_list = [
            {"name": name,
             "description": info["description"],
             "inputSchema": info["inputSchema"],
             "outputSchema": info["outputSchema"]}
            for name, info in TOOLS.items()
        ]
        send_response(req_id, {"tools": tools_list})

    elif method == "tools/call":
        name = params.get("name") or params.get("tool_name")
        args = params.get("arguments") or params.get("args") or {}
        log(f"Executing tool {name} with args={args}")
        if name not in TOOLS:
            send_response(req_id, error=f"Unknown tool '{name}'")
        else:
            fn = TOOLS[name]["func"]
            # unwrap decorated FunctionTool if present
            real_fn = getattr(fn, "__wrapped__", getattr(fn, "func", fn))
            func_name = getattr(real_fn, "__name__", name)
            log(f"Calling function {func_name}")
            try:
                output = real_fn(**args)
                send_response(req_id, output)
            except Exception as e:
                log(f"Tool exception: {e}")
                send_response(req_id, error=str(e))

    elif method == "shutdown":
        send_response(req_id, {})
        log("Shutdown requested—exiting.")
        sys.exit(0)

    else:
        log(f"Unknown method: {method}")
