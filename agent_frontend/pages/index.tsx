import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import {
  FiCommand,
  FiFileText,
  FiCode,
  FiLayers,
  FiLogIn,
  FiMessageCircle,
  FiLock,
  FiKey,
} from "react-icons/fi";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import LoadingMessage from "../components/LoadingMessage";
import NavBar from "../components/NavBar";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

interface ChatMessageData {
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface QuickAction {
  label: string;
  value: string;
  icon: React.ReactNode;
}

// Landing page component for unauthenticated users
const LandingPage = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-violet-600">
          AI Agent Assistant
        </h1>
        <p className="text-xl md:text-2xl text-secondary-700 mb-8">
          Your intelligent assistant for managing tasks, API keys and more.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={() => router.push("/login")}
            className="btn-primary flex items-center justify-center text-lg py-3 px-8"
          >
            <FiLogIn className="mr-2" />
            Sign In
          </button>
          <button
            onClick={() => router.push("/login?mode=signup")}
            className="btn-secondary flex items-center justify-center text-lg py-3 px-8"
          >
            Get Started
          </button>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-panel p-6 rounded-xl text-center"
        >
          <div className="bg-primary-100 p-3 rounded-full inline-flex mb-4">
            <FiMessageCircle className="text-primary-600 text-2xl" />
          </div>
          <h2 className="text-xl font-semibold mb-3">Intelligent Chat</h2>
          <p className="text-secondary-600">
            Chat with our AI assistant to get help with your tasks, questions,
            and more.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-panel p-6 rounded-xl text-center"
        >
          <div className="bg-violet-100 p-3 rounded-full inline-flex mb-4">
            <FiKey className="text-violet-600 text-2xl" />
          </div>
          <h2 className="text-xl font-semibold mb-3">API Key Management</h2>
          <p className="text-secondary-600">
            Securely store and manage your API keys with our easy-to-use
            interface.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-panel p-6 rounded-xl text-center"
        >
          <div className="bg-indigo-100 p-3 rounded-full inline-flex mb-4">
            <FiLock className="text-indigo-600 text-2xl" />
          </div>
          <h2 className="text-xl font-semibold mb-3">Secure Access</h2>
          <p className="text-secondary-600">
            Your data is protected with secure authentication and row-level
            security.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// Chat interface component for authenticated users
interface ChatInterfaceProps {
  onSendMessage: (message: string) => Promise<void>;
  chatHistory: ChatMessageData[];
  isLoading: boolean;
  quickActions: QuickAction[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  chatHistory,
  isLoading,
  quickActions,
}) => {
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel rounded-2xl shadow-glass overflow-hidden border border-white border-opacity-40 w-full max-w-4xl"
    >
      {/* Messages Area */}
      <div className="h-[70vh] overflow-y-auto p-4 space-y-4">
        {chatHistory.map((message: ChatMessageData, index: number) => (
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
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        quickActions={quickActions}
      />
    </motion.div>
  );
};

export default function Home() {
  const { user, signOut } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatMessageData[]>([
    {
      sender: "ai",
      content:
        "✨ **Welcome to your AI Assistant!** I'm here to help you with emails, meetings, files, and more. How may I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSendMessage(messageContent: string) {
    // Don't process messages if not authenticated
    if (!user || !messageContent.trim()) return;

    const userMessage: ChatMessageData = {
      sender: "user",
      content: messageContent,
      timestamp: new Date(),
    };
    setChatHistory((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Ensure we have a valid user ID
      if (!user.id) {
        throw new Error("User ID is missing. Please sign in again.");
      }

      // Prepare request payload with user ID
      const payload = {
        message: userMessage.content,
        user_id: user.id,
      };

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Handle HTTP errors
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.error || `Server error: ${res.status} ${res.statusText}`
        );
      }

      const data = await res.json();

      if (!data || !data.response) {
        throw new Error("Invalid response from server");
      }

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
          error instanceof Error
            ? `Error: ${error.message}`
            : "An error occurred while processing your request. Please try again later.",
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogout = async () => {
    try {
      await signOut();
      // No need to redirect as we're already on the home page
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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

      {user ? (
        <NavBar userEmail={user?.email} onLogout={handleLogout} />
      ) : (
        <nav className="w-full px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xl md:text-2xl font-semibold text-secondary-900">
              <span className="text-primary-500 bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-violet-500">
                AI
              </span>{" "}
              Agent Assistant
            </span>
          </motion.div>

          <button
            onClick={() => router.push("/login")}
            className="btn-primary flex items-center"
          >
            <FiLogIn className="mr-2" />
            Sign In
          </button>
        </nav>
      )}

      <main className="flex-1 container mx-auto px-4 py-6 flex items-center justify-center">
        {user ? (
          <ChatInterface
            onSendMessage={handleSendMessage}
            chatHistory={chatHistory}
            isLoading={isLoading}
            quickActions={quickActions}
          />
        ) : (
          <LandingPage />
        )}
      </main>

      <footer className="py-3 text-center text-secondary-400 text-xs">
        <p>
          © {new Date().getFullYear()} AI Agent Interface • Built with Next.js
        </p>
      </footer>
    </div>
  );
}
