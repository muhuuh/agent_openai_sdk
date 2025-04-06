import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { FiCommand, FiFileText, FiCode, FiLayers } from "react-icons/fi";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import LoadingMessage from "../components/LoadingMessage";

interface ChatMessageData {
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface QuickAction {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export default function Home() {
  const [chatHistory, setChatHistory] = useState<ChatMessageData[]>([
    {
      sender: "ai",
      content:
        "✨ **Welcome to your AI Assistant!** I'm here to help you with emails, meetings, files, and more. How may I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  async function handleSendMessage(messageContent: string) {
    if (!messageContent.trim()) return;

    const userMessage: ChatMessageData = {
      sender: "user",
      content: messageContent,
      timestamp: new Date(),
    };
    setChatHistory((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await res.json();
      const aiResponse: ChatMessageData = {
        sender: "ai",
        content:
          data.response?.final_output || "Sorry, I couldn't get a response.",
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: ChatMessageData = {
        sender: "ai",
        content:
          "An error occurred while processing your request. Please check the console.",
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  const quickActions: QuickAction[] = [
    {
      label: "Email Summary",
      value: "Please summarise my last 3 emails",
      icon: <FiFileText />,
    },
    {
      label: "Today's Meetings",
      value: "Please tell me which meetings I have today",
      icon: <FiCommand />,
    },
    {
      label: "Find File",
      value: 'Please find file named "" in my drive',
      icon: <FiCode />,
    },
    {
      label: "List Drive Files",
      value: "List the files I currently have saved on my Google Drive",
      icon: <FiLayers />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
      <Head>
        <title>AI Agent Chat</title>
        <meta
          name="description"
          content="Chat interface for interacting with AI Agent"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="p-6 flex-shrink-0">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl md:text-2xl font-semibold text-center text-secondary-900"
        >
          <span className="text-primary-500 bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-violet-500">
            AI
          </span>{" "}
          Agent Assistant
        </motion.h1>
      </header>

      <main className="flex-1 container mx-auto max-w-4xl px-4 pb-4">
        {/* Chat Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-panel rounded-2xl shadow-glass overflow-hidden border border-white border-opacity-40"
        >
          {/* Messages Area */}
          <div className="h-[70vh] overflow-y-auto p-4 space-y-4">
            {chatHistory.map((message, index) => (
              <ChatMessage
                key={index}
                sender={message.sender}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}
            {isLoading && <LoadingMessage />}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            quickActions={quickActions}
          />
        </motion.div>
      </main>

      <footer className="py-3 text-center text-secondary-400 text-xs">
        <p>
          © {new Date().getFullYear()} AI Agent Interface • Built with Next.js
        </p>
      </footer>
    </div>
  );
}
