import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { FiUser, FiCpu } from "react-icons/fi";

interface ChatMessageProps {
  sender: "user" | "ai";
  content: string;
  timestamp?: Date;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  sender,
  content,
  timestamp = new Date(),
}) => {
  const isUser = sender === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`flex max-w-[85%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? "ml-3" : "mr-3"}`}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isUser
                ? "bg-primary-100 text-primary-600"
                : "bg-secondary-100 text-secondary-600"
            }`}
          >
            {isUser ? <FiUser size={18} /> : <FiCpu size={18} />}
          </div>
        </div>

        {/* Message content */}
        <div>
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser ? "bg-primary-500 text-white" : "glass-panel"
            }`}
          >
            {sender === "ai" ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Add target="_blank" to links for security and usability
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-500 hover:text-primary-600"
                      />
                    ),
                    // Custom styling for code blocks
                    pre: ({ node, ...props }) => (
                      <pre
                        className="bg-secondary-100 p-2 rounded-lg text-secondary-800 overflow-x-auto"
                        {...props}
                      />
                    ),
                    code: ({ node, ...props }) => {
                      return (
                        <code
                          className="bg-secondary-100 text-secondary-800 px-1 py-0.5 rounded text-sm"
                          {...props}
                        />
                      );
                    },
                    // Add special styling for headings
                    h1: ({ node, ...props }) => (
                      <h1 className="text-xl font-semibold" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 className="text-lg font-semibold" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="text-base font-semibold" {...props} />
                    ),
                    // Custom styling for lists
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc pl-5" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal pl-5" {...props} />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm md:text-base">
                {content}
              </p>
            )}
          </div>

          {/* Timestamp */}
          <div
            className={`text-xs text-secondary-400 mt-1 ${
              isUser ? "text-right" : "text-left"
            }`}
          >
            {timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
