import React, { useState, useRef, useEffect } from "react";
import { FiSend, FiLoader, FiChevronRight } from "react-icons/fi";

interface QuickAction {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  quickActions: QuickAction[];
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  quickActions,
}) => {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [inputValue]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue(""); // Clear input after sending
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default newline on Enter
      handleSend();
    }
  };

  const handleQuickAction = (value: string) => {
    setInputValue(value);
    // Focus the textarea after selecting a quick action
    textareaRef.current?.focus();
  };

  return (
    <div className="px-4 pb-6">
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleQuickAction(action.value)}
            className="btn-secondary flex items-center text-sm relative group overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            disabled={isLoading}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-violet-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center">
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
              <FiChevronRight className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </button>
        ))}
      </div>

      {/* Input Textarea and Send Button */}
      <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-xl shadow-md border border-white border-opacity-40 p-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end"
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI assistant..."
            className="flex-1 resize-none max-h-[120px] border-0 outline-none focus:ring-0 bg-transparent p-2 text-secondary-800"
            rows={1}
            disabled={isLoading}
          />
          <div className="p-1">
            <button
              type="submit"
              className="p-3 rounded-full bg-gradient-to-r from-primary-500 to-violet-500 text-white hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:shadow-none"
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? <FiLoader className="animate-spin" /> : <FiSend />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
