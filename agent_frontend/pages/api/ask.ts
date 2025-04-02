import type { NextApiRequest, NextApiResponse } from "next";
import { spawn } from "child_process";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "No message provided." });
  }

  const python = spawn("python", ["../agent_server/main.py"]);

  let output = "";
  python.stdout.on("data", (data) => {
    output += data.toString();
  });

  python.stderr.on("data", (data) => {
    console.error("stderr:", data.toString());
  });

  python.on("close", (code) => {
    console.log(`Python process exited with code ${code}`);
    res.status(200).json({ response: output });
  });

  // Send input to agent
  python.stdin.write(userMessage + "\n");
  python.stdin.end();
}
