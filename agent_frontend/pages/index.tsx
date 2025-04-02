import { useState } from "react";
import Head from "next/head";

export default function Home() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleAsk() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      setResponse(data.response?.final_output || "No final output received.");
    } catch (error) {
      console.error("Error:", error);
      setResponse("An error occurred while processing your request.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>AI Agent Interface</title>
        <meta
          name="description"
          content="Interface for interacting with AI Agent"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          🔧 AI Agent Interface
        </h1>

        <div className="bg-white shadow-md rounded-lg p-6 max-w-3xl mx-auto">
          <div className="mb-4">
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Ask your AI agent
            </label>
            <textarea
              id="prompt"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AI agent..."
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAsk}
              disabled={isLoading || !input.trim()}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                isLoading || !input.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }`}
            >
              {isLoading ? "Processing..." : "Ask"}
            </button>
          </div>

          {response && (
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Response:
              </h2>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 overflow-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800">
                  {response}
                </pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
