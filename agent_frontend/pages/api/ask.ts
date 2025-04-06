import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { message, user_id } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    const response = await fetch("http://localhost:8000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        user_id: user_id || null, // Forward user ID if available
      }),
    });

    const data = await response.json();
    res.status(200).json({ response: data.response });
  } catch (error) {
    console.error("Failed to query agent server:", error);
    res.status(500).json({ error: "Agent server failed." });
  }
}
