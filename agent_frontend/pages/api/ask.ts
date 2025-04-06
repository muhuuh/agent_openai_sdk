import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, user_id } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    // Prepare request payload
    const payload: { message: string; user_id?: string } = {
      message: message,
    };

    // Only add user_id if it's provided and valid
    if (user_id && typeof user_id === "string" && user_id.trim() !== "") {
      payload.user_id = user_id;
    } else {
      console.warn("Request made without a valid user_id");
    }

    const response = await fetch("http://localhost:8000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Agent server error:", response.status, errorData);
      return res.status(response.status).json({
        error: "Agent server returned an error",
        details: errorData || response.statusText,
      });
    }

    const data = await response.json();
    res.status(200).json({ response: data.response });
  } catch (error) {
    console.error("Failed to query agent server:", error);
    res.status(500).json({ error: "Agent server failed." });
  }
}
