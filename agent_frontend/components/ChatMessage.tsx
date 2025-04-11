import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import {
  FiUser,
  FiCpu,
  FiMail,
  FiCalendar,
  FiClock,
  FiFileText,
} from "react-icons/fi";
import type { Components } from "react-markdown";

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

  // Enhanced markdown components with better styling
  const markdownComponents: Components = {
    // Add target="_blank" to links for security and usability
    a: (props) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-500 hover:text-indigo-600 underline decoration-dotted"
      />
    ),
    // Custom styling for code blocks
    pre: (props) => (
      <pre
        className="bg-gray-50 p-3 my-2 rounded-lg text-gray-800 overflow-x-auto border border-gray-100 font-mono text-sm"
        {...props}
      />
    ),
    code: (props) => (
      <code
        className="bg-gray-50 text-gray-800 px-1 py-0.5 rounded text-sm font-mono"
        {...props}
      />
    ),
    // Enhanced heading styles
    h1: (props) => (
      <h1
        className="text-xl font-semibold text-gray-800 mt-3 mb-2"
        {...props}
      />
    ),
    h2: (props) => (
      <h2
        className="text-lg font-semibold text-gray-800 mt-3 mb-2"
        {...props}
      />
    ),
    h3: (props) => (
      <h3
        className="text-base font-semibold text-gray-800 mt-2 mb-1"
        {...props}
      />
    ),
    // Enhanced list styling
    ul: (props) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
    ol: (props) => (
      <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />
    ),
    // Enhanced paragraph spacing
    p: (props) => <p className="my-1.5 text-gray-700" {...props} />,
    // Special styling for list items
    li: ({ children, ...props }) => {
      // Check if this is potentially an email summary item
      const childrenStr = String(children);
      const isEmailItem =
        childrenStr.includes("Subject:") ||
        childrenStr.includes("From:") ||
        childrenStr.includes("Date:") ||
        childrenStr.includes("Summary:");

      if (isEmailItem) {
        return (
          <li className="mb-3 pb-2" {...props}>
            {children}
          </li>
        );
      }

      return (
        <li className="mb-1" {...props}>
          {children}
        </li>
      );
    },
    // Enhanced styling for strong/bold text
    strong: (props) => (
      <strong className="font-semibold text-gray-900" {...props} />
    ),
  };

  // Process the content to add special formatting for patterns like "Subject:", "From:", etc.
  const processContent = (content: string) => {
    if (sender !== "ai") return content;

    // Enhance the display of email-related keywords
    let enhanced = content
      .replace(/Subject:/g, "**Subject:**")
      .replace(/From:/g, "**From:**")
      .replace(/Date:/g, "**Date:**")
      .replace(/Summary:/g, "**Summary:**");

    return enhanced;
  };

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
                ? "bg-gradient-to-br from-blue-400 to-violet-500 text-white"
                : "bg-gradient-to-br from-blue-400 to-violet-500 text-white"
            }`}
          >
            {isUser ? <FiUser size={18} /> : <FiCpu size={18} />}
          </div>
        </div>

        {/* Message content */}
        <div className="max-w-full">
          <div
            className={`rounded-2xl px-5 py-3.5 ${
              isUser
                ? "bg-indigo-500 text-white"
                : "bg-white border border-gray-200 text-gray-800"
            }`}
          >
            {sender === "ai" ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {processContent(content)}
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
            className={`text-xs text-gray-400 mt-1.5 ${
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
