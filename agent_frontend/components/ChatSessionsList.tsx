import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiMessageSquare,
  FiTrash2,
  FiEdit2,
  FiMessageCircle,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface ChatSessionsListProps {
  onSessionSelect: (sessionId: string) => void;
  currentSessionId: string | null;
  onNewSession: () => void;
}

const ChatSessionsList: React.FC<ChatSessionsListProps> = ({
  onSessionSelect,
  currentSessionId,
  onNewSession,
}) => {
  const { supabase, user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Fetch chat sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("chat_sessions")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setSessions(data || []);
      } catch (error) {
        console.error("Error fetching chat sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [supabase, user]);

  // Delete a chat session
  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent session selection

    if (!user || !confirm("Are you sure you want to delete this chat session?"))
      return;

    try {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update sessions list
      setSessions(sessions.filter((session) => session.id !== sessionId));

      // If current session is deleted, create a new one
      if (currentSessionId === sessionId) {
        onNewSession();
      }
    } catch (error) {
      console.error("Error deleting chat session:", error);
    }
  };

  // Start editing session title
  const handleStartEdit = (
    sessionId: string,
    title: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent session selection
    setEditingSession(sessionId);
    setEditTitle(title);
  };

  // Save edited session title
  const handleSaveTitle = async (sessionId: string, e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !editTitle.trim()) return;

    try {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ title: editTitle.trim() })
        .eq("id", sessionId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update sessions list
      setSessions(
        sessions.map((session) =>
          session.id === sessionId
            ? { ...session, title: editTitle.trim() }
            : session
        )
      );

      // Exit edit mode
      setEditingSession(null);
    } catch (error) {
      console.error("Error updating chat session title:", error);
    }
  };

  return (
    <div className="w-full bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white border-opacity-30">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-secondary-800">
          Chat Sessions
        </h2>
        <button
          onClick={onNewSession}
          className="p-2 rounded-full bg-indigo-500 text-white shadow-sm hover:bg-indigo-600 transition-colors"
          aria-label="New chat session"
        >
          <FiPlus size={18} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-secondary-500">
          Loading sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 text-secondary-500">
          <FiMessageCircle className="mx-auto mb-2 text-3xl text-secondary-400" />
          <p>No chat sessions yet.</p>
          <p>Start a new chat!</p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          <AnimatePresence>
            {sessions.map((session) => (
              <motion.li
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSessionSelect(session.id)}
                className={`rounded-lg px-4 py-3 flex justify-between items-center cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? "bg-indigo-100/70 border border-indigo-200"
                    : "bg-white/50 hover:bg-white/70 border border-transparent hover:border-indigo-100"
                }`}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <FiMessageSquare
                    className={`mr-3 flex-shrink-0 ${
                      currentSessionId === session.id
                        ? "text-indigo-600"
                        : "text-secondary-500"
                    }`}
                  />

                  {editingSession === session.id ? (
                    <form
                      onSubmit={(e) => handleSaveTitle(session.id, e)}
                      className="flex-1"
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        className="w-full px-2 py-1 text-sm bg-white rounded border border-indigo-200 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </form>
                  ) : (
                    <div className="truncate flex-1 text-secondary-800 font-medium">
                      {session.title || "Untitled Chat"}
                    </div>
                  )}
                </div>

                <div className="flex space-x-0.5 ml-2 opacity-60 hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) =>
                      handleStartEdit(session.id, session.title, e)
                    }
                    className="p-1.5 text-secondary-600 hover:text-secondary-800 rounded-full hover:bg-white"
                    aria-label="Edit title"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="p-1.5 text-secondary-600 hover:text-red-600 rounded-full hover:bg-white"
                    aria-label="Delete session"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
};

export default ChatSessionsList;
