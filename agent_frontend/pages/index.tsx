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
  FiPlusCircle,
  FiSend,
} from "react-icons/fi";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import LoadingMessage from "../components/LoadingMessage";
import NavBar from "../components/NavBar";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import ChatSessionsList from "../components/ChatSessionsList";

interface ChatMessageData {
  id?: string;
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
  session_id?: string;
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
  currentSessionId: string | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  chatHistory,
  isLoading,
  quickActions,
  currentSessionId,
}) => {
  const chatEndRef = useRef<null | HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleQuickActionClick = (text: string) => {
    setInputValue(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl shadow-sm overflow-hidden border border-gray-200 w-full max-w-4xl flex flex-col bg-white"
    >
      {/* Messages Area */}
      <div className="h-[70vh] overflow-y-auto p-4 space-y-4 bg-white">
        {chatHistory.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="text-secondary-500 bg-white bg-opacity-50 p-6 rounded-2xl shadow-sm max-w-md">
              <FiMessageCircle className="text-4xl mx-auto mb-4 text-primary-500" />
              <h3 className="text-xl font-medium mb-2">Start a conversation</h3>
              <p className="max-w-sm text-sm">
                Ask me anything about your tasks, emails, files, or meetings.
                I'm here to help you stay organized and productive.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-6">
                {quickActions.slice(0, 4).map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickActionClick(action.value)}
                    className="flex items-center justify-center bg-white bg-opacity-70 hover:bg-opacity-100 text-secondary-700 text-sm px-3 py-2 rounded-lg border border-white border-opacity-50 transition-all hover:shadow-md"
                  >
                    <span className="mr-2 text-primary-500">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((message: ChatMessageData, index: number) => (
              <ChatMessage
                key={message.id || index}
                sender={message.sender}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}
            {isLoading && <LoadingMessage />}
          </>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick action buttons below chat */}
      <div className="flex flex-wrap gap-2 justify-center px-4 py-3 border-t border-gray-100">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickActionClick(action.value)}
            className="relative overflow-hidden group flex items-center text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            {/* Gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-violet-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="mr-2 text-indigo-500 relative z-10">
              {action.icon}
            </span>
            <span className="relative z-10">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="px-4 py-4 bg-white border-t border-gray-100">
        <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-sm">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (inputValue.trim() && !isLoading) {
                  onSendMessage(inputValue);
                  setInputValue("");
                }
              }
            }}
            placeholder="Ask your AI assistant..."
            disabled={isLoading}
            className="flex-1 py-3 pl-4 pr-2 resize-none bg-transparent outline-none text-gray-700 text-sm min-h-[24px] max-h-[120px]"
            rows={1}
          />

          <div className="pr-2">
            <button
              onClick={() => {
                if (inputValue.trim() && !isLoading) {
                  onSendMessage(inputValue);
                  setInputValue("");
                }
              }}
              className={`p-2 rounded-full flex items-center justify-center ${
                isLoading
                  ? "bg-gradient-to-br from-blue-400 to-violet-500 text-white"
                  : inputValue.trim()
                  ? "bg-gradient-to-br from-blue-400 to-violet-500 text-white hover:shadow-md"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              disabled={!inputValue.trim() || isLoading}
              title="Send message"
            >
              {isLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <FiSend size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const { user, signOut, supabase } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const router = useRouter();

  // Generate a welcome message based on the session
  const generateWelcomeMessage = () => {
    return {
      sender: "ai" as const,
      content:
        "✨ **Welcome to your AI Assistant!** I'm here to help you with emails, meetings, files, and more. How may I assist you today?",
      timestamp: new Date(),
    };
  };

  // Create a new chat session
  const createNewSession = async () => {
    if (!user) return;

    try {
      // Create new session
      const { data: sessionData, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert([
          {
            user_id: user.id,
            title: "New Chat",
          },
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      const newSessionId = sessionData.id;
      setCurrentSessionId(newSessionId);

      // Add welcome message to new session
      const welcomeMessage = generateWelcomeMessage();

      const { data: msgData, error: msgError } = await supabase
        .from("messages")
        .insert([
          {
            session_id: newSessionId,
            sender: welcomeMessage.sender,
            content: welcomeMessage.content,
            created_at: welcomeMessage.timestamp.toISOString(),
          },
        ])
        .select()
        .single();

      if (msgError) throw msgError;

      // Set the new message with its ID from the database
      setChatHistory([
        { ...welcomeMessage, id: msgData.id, session_id: newSessionId },
      ]);
    } catch (error) {
      console.error("Error creating new session:", error);
    }
  };

  // Load an existing chat session
  const loadChatSession = async (sessionId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setCurrentSessionId(sessionId);

      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Transform messages to ChatMessageData format
      const formattedMessages: ChatMessageData[] = (messages || []).map(
        (msg) => ({
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          session_id: msg.session_id,
        })
      );

      setChatHistory(formattedMessages);
    } catch (error) {
      console.error("Error loading chat session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a chat session
  const handleSessionSelect = (sessionId: string) => {
    if (sessionId === currentSessionId) return;
    loadChatSession(sessionId);
  };

  // Initialize or load most recent chat session
  useEffect(() => {
    const initializeSession = async () => {
      if (!user) return;

      try {
        // Get most recent session
        const { data: recentSession, error } = await supabase
          .from("chat_sessions")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 means no rows returned
          throw error;
        }

        if (recentSession) {
          // Load existing session
          loadChatSession(recentSession.id);
        } else {
          // Create a new session
          createNewSession();
        }
      } catch (error) {
        console.error("Error initializing session:", error);
        // Fallback to creating a new session
        createNewSession();
      }
    };

    if (user) {
      initializeSession();
    }
  }, [user]);

  async function handleSendMessage(messageContent: string) {
    // Don't process messages if not authenticated or no current session
    if (!user || !currentSessionId || !messageContent.trim()) return;

    const userMessage: ChatMessageData = {
      sender: "user",
      content: messageContent,
      timestamp: new Date(),
      session_id: currentSessionId,
    };

    // Update local state first for immediate feedback
    setChatHistory((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Ensure we have a valid user ID
      if (!user.id) {
        throw new Error("User ID is missing. Please sign in again.");
      }

      // Store user message in Supabase
      const { data: msgData, error: msgError } = await supabase
        .from("messages")
        .insert([
          {
            session_id: currentSessionId,
            sender: userMessage.sender,
            content: userMessage.content,
            created_at: userMessage.timestamp.toISOString(),
          },
        ])
        .select()
        .single();

      if (msgError) throw msgError;

      // Update the message with its ID
      userMessage.id = msgData.id;

      // Prepare request payload with user ID
      const payload = {
        message: userMessage.content,
        user_id: user.id,
        session_id: currentSessionId,
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
        session_id: currentSessionId,
      };

      // Store AI response in Supabase
      const { data: aiMsgData, error: aiMsgError } = await supabase
        .from("messages")
        .insert([
          {
            session_id: currentSessionId,
            sender: aiResponse.sender,
            content: aiResponse.content,
            created_at: aiResponse.timestamp.toISOString(),
          },
        ])
        .select()
        .single();

      if (aiMsgError) throw aiMsgError;

      // Update AI message with its ID
      aiResponse.id = aiMsgData.id;

      // Update chat history with AI response
      setChatHistory((prev) => [...prev, aiResponse]);

      // Update session title if it's still the default "New Chat"
      updateSessionTitleIfNeeded(currentSessionId, userMessage.content);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: ChatMessageData = {
        sender: "ai",
        content:
          error instanceof Error
            ? `Error: ${error.message}`
            : "An error occurred while processing your request. Please try again later.",
        timestamp: new Date(),
        session_id: currentSessionId,
      };

      // Store error message in Supabase
      try {
        const { data: errorMsgData } = await supabase
          .from("messages")
          .insert([
            {
              session_id: currentSessionId,
              sender: errorMessage.sender,
              content: errorMessage.content,
              created_at: errorMessage.timestamp.toISOString(),
            },
          ])
          .select()
          .single();

        if (errorMsgData) {
          errorMessage.id = errorMsgData.id;
        }
      } catch (saveError) {
        console.error("Error saving error message:", saveError);
      }

      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  // Update session title based on first user message
  const updateSessionTitleIfNeeded = async (
    sessionId: string,
    message: string
  ) => {
    try {
      // Get current session
      const { data: session, error: fetchError } = await supabase
        .from("chat_sessions")
        .select("title")
        .eq("id", sessionId)
        .single();

      if (fetchError) throw fetchError;

      // If title is "New Chat", update with first few words from message
      if (session && session.title === "New Chat") {
        // Generate title from first message (max 5 words)
        const words = message.split(" ");
        const title =
          words.slice(0, 5).join(" ") + (words.length > 5 ? "..." : "");

        const { error: updateError } = await supabase
          .from("chat_sessions")
          .update({ title })
          .eq("id", sessionId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error("Error updating session title:", error);
    }
  };

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
    <div className="flex flex-col min-h-screen bg-blue-50">
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

      <main className="flex-1 container mx-auto px-4 py-6">
        {user ? (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar with chat sessions */}
            <div className="md:w-1/4 w-full">
              <ChatSessionsList
                onSessionSelect={handleSessionSelect}
                currentSessionId={currentSessionId}
                onNewSession={createNewSession}
              />
            </div>

            {/* Chat interface */}
            <div className="md:w-3/4 w-full flex justify-center">
              <ChatInterface
                onSendMessage={handleSendMessage}
                chatHistory={chatHistory}
                isLoading={isLoading}
                quickActions={quickActions}
                currentSessionId={currentSessionId}
              />
            </div>
          </div>
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
