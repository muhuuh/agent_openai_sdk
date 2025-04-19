#!/usr/bin/env python3
import sys, json
# 1) import your business logic functions
from tools.my_service import fn_one, fn_two, fn_three

# 2) register them here with JSON‑Schema
TOOLS = {
  "fn_one": {
    "description": "Does action one",
    "inputSchema": { "type":"object", "properties": { "foo": {"type":"string"} }, "required":["foo"] },
    "outputSchema": { "type":"string" },
    "func": fn_one
  },
  # … repeat for fn_two, fn_three …
}

# helper to write JSON lines
def send(id_, *, result=None, error=None):
    resp = { "jsonrpc":"2.0", "id": id_ }
    if (error):
      resp["error"] = { "message": str(error) }
    else:
      resp["result"] = result
    sys.stdout.write(json.dumps(resp) + "\n")
    sys.stdout.flush()

# main loop
for line in sys.stdin:
    try:
      req = json.loads(line)
    except:
      continue

    mth   = req.get("method")
    id_   = req.get("id")
    param = req.get("params", {})

    if mth == "initialize":
      send(id_, result={ "protocolVersion": "2.0", "serverInfo": { "name":"my_service_mcp" }})
    elif mth == "tools/list":
      send(id_, result={
        "tools": [
          {
            "name":   name,
            "description": meta["description"],
            "inputSchema": meta["inputSchema"],
            "outputSchema": meta["outputSchema"]
          }
          for name,meta in TOOLS.items()
        ]
      })
    elif mth == "tools/call":
      name = param.get("name") or param.get("tool_name")
      args = param.get("arguments", {}) or {}
      if name not in TOOLS:
         send(id_, error=f"Unknown tool '{name}'"); continue
      fn = getattr(TOOLS[name]["func"], "__wrapped__", TOOLS[name]["func"])
      try:
        result = fn(**args)
        send(id_, result={ "content": [{ "type":"text", "text": result }] })
      except Exception as e:
        send(id_, error=str(e))
    elif mth == "shutdown":
      send(id_, result=None)
      sys.exit(0)
    else:
      send(id_, error=f"Unknown method '{mth}'")
