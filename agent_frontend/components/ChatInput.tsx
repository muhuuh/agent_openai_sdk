import React, { useState, useRef, useEffect } from "react";
import { FiSend, FiLoader } from "react-icons/fi";

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
            className="btn-secondary flex items-center text-sm"
            disabled={isLoading}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </button>
        ))}
      </div>

      {/* Input Textarea and Send Button */}
      <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-xl shadow-soft border border-secondary-100 p-2">
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
            placeholder="Ask your AI agent... (Shift+Enter for new line)"
            className="flex-1 resize-none max-h-[120px] border-0 outline-none focus:ring-0 bg-transparent p-2 text-secondary-800"
            rows={1}
            disabled={isLoading}
          />
          <div className="p-1">
            <button
              type="submit"
              className="p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-70"
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
