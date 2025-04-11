import React, { useState, useRef, useEffect } from "react";
import { FiSend, FiMic, FiPaperclip, FiX } from "react-icons/fi";

interface QuickAction {
  label: string;
  value: string;
  icon: React.ReactNode;
}

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  quickActions: QuickAction[];
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  quickActions,
}) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      await onSendMessage(message);
      setMessage("");
    }
  };

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "24px";
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 relative">
      <div
        className={`flex items-end bg-white rounded-2xl shadow-sm transition-all border ${
          isFocused
            ? "border-primary-400 shadow-inner-sm"
            : "border-white border-opacity-60"
        } pr-2`}
      >
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isLoading}
          className="flex-1 py-3 pl-4 pr-2 resize-none bg-transparent outline-none text-secondary-800 text-sm max-h-[120px] min-h-[48px]"
          rows={1}
        />

        <div className="flex items-center">
          {message && (
            <button
              type="button"
              onClick={() => setMessage("")}
              className="p-1.5 text-secondary-400 hover:text-secondary-600 rounded-full"
              title="Clear message"
            >
              <FiX size={16} />
            </button>
          )}

          <button
            type="button"
            className="p-2 text-secondary-400 hover:text-secondary-600 rounded-full"
            title="Upload a file"
            disabled={isLoading}
          >
            <FiPaperclip size={18} />
          </button>

          <button
            type="button"
            className="p-2 text-secondary-400 hover:text-secondary-600 rounded-full mr-1"
            title="Voice input"
            disabled={isLoading}
          >
            <FiMic size={18} />
          </button>

          <button
            type="submit"
            className={`p-2.5 rounded-full flex items-center justify-center ${
              message.trim() && !isLoading
                ? "bg-primary-500 text-white hover:bg-primary-600"
                : "bg-secondary-200 text-secondary-400 cursor-not-allowed"
            }`}
            disabled={!message.trim() || isLoading}
            title="Send message"
          >
            <FiSend size={18} />
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
