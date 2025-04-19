#!/usr/bin/env python3
import sys, json
from tools.weather import (
    get_weather,
    get_hourly_forecast,
    get_daily_forecast,
)

def log(msg: str):
    print(f"[MCP] {msg}", file=sys.stderr, flush=True)

# ----------------------------------------------------------------------
# tool registry
# ----------------------------------------------------------------------
TOOLS = {
    "get_weather": {
        "description": "Get current weather for a city",
        "inputSchema":  {"type": "object",
                         "properties": {"city": {"type": "string"}},
                         "required": ["city"]},
        "outputSchema": {"type": "string"},
        "func": get_weather,
    },
    "get_hourly_forecast": {
        "description": "48‑hour maximum forecast for a specific city",
        "inputSchema":  {"type": "object",
                         "properties": {"city":  {"type": "string"},
                                        "hours": {"type": "integer"}},
                         "required": ["city", "hours"]},
        "outputSchema": {"type": "string"},
        "func": get_hourly_forecast,
    },
    "get_daily_forecast": {
        "description": "7‑day maximum forecast for a specific city",
        "inputSchema":  {"type": "object",
                         "properties": {"city": {"type": "string"},
                                        "days": {"type": "integer"}},
                         "required": ["city", "days"]},
        "outputSchema": {"type": "string"},
        "func": get_daily_forecast,
    },
}

# ----------------------------------------------------------------------
# helper to send a JSON‑RPC response
# ----------------------------------------------------------------------
def send(id_, *, result=None, error=None):
    resp = {"jsonrpc": "2.0", "id": id_}
    if error is not None:
        resp["error"] = {"message": str(error)}
    else:
        resp["result"] = result
    sys.stdout.write(json.dumps(resp) + "\n")
    sys.stdout.flush()
    log(f"→ {resp}")

log("weather_mcp started")

# ----------------------------------------------------------------------
# main JSON‑RPC loop
# ----------------------------------------------------------------------
for line in sys.stdin:
    try:
        req = json.loads(line)
    except json.JSONDecodeError:
        log("Skipping invalid JSON")
        continue

    mth   = req.get("method")
    id_   = req.get("id")
    param = req.get("params", {})

    # ---- handshake ---------------------------------------------------
    if mth == "initialize":
        send(id_, result={
            "protocolVersion": param.get("protocolVersion", ""),
            "capabilities":    param.get("capabilities", {}),
            "serverInfo":      {"name": "weather_mcp", "version": "0.1.0"},
        })

    elif mth == "notifications/initialized":
        log("Client initialised")

    # ---- list tools --------------------------------------------------
    elif mth == "tools/list":
        send(id_, result={
            "tools": [
                {"name": n,
                 "description": t["description"],
                 "inputSchema":  t["inputSchema"],
                 "outputSchema": t["outputSchema"]}
                for n, t in TOOLS.items()
            ]
        })

    # ---- call a tool -------------------------------------------------
    elif mth == "tools/call":
        name = param.get("name") or param.get("tool_name")
        args = param.get("arguments") or {}

        if name not in TOOLS:
            send(id_, error=f"Unknown tool '{name}'")
            continue

        fn = getattr(TOOLS[name]["func"], "__wrapped__", TOOLS[name]["func"])
        log(f"Executing {name}({args})")

        try:
            result_text = fn(**args)
            send(
                id_,
                result={
                    "content": [
                        {
                            "type": "text",
                            "text": result_text
                        }
                    ]
                }
            )

        except Exception as exc:
            send(id_, error=str(exc))

    # ---- shutdown ----------------------------------------------------
    elif mth == "shutdown":
        send(id_, result={})
        log("Shutdown")
        sys.exit(0)

    else:
        send(id_, error=f"Unknown method '{mth}'")
