// pages/api/ask.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("[ask.ts] ↪️ Browser payload:", req.body);

  const { message, user_id, session_id } = req.body;
  const payload: any = { message, user_id };
  if (session_id && typeof session_id === "string") {
    payload.session_id = session_id;
  }

  console.log("[ask.ts] 📤 Forwarding to agent-server:", payload);

  let response;
  try {
    response = await fetch("http://localhost:8000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[ask.ts] ❌ Fetch error:", err);
    return res.status(500).json({ error: "Could not reach agent server" });
  }
  console.log("[ask.ts] HTTP status from agent-server:", response.status);

  let data: any;
  try {
    data = await response.json();
  } catch (err) {
    console.error("[ask.ts] ❌ Invalid JSON from agent-server:", err);
    return res.status(500).json({ error: "Invalid JSON from agent server" });
  }
  console.log("[ask.ts] ← JSON from agent-server:", data);

  if (!data?.response) {
    console.error("[ask.ts] ❌ Missing `response` field:", data);
    return res.status(500).json({ error: "No response from agent server" });
  }

  return res.status(200).json({ response: data.response });
}
