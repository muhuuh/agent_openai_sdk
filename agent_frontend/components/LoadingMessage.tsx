import React from "react";
import { motion } from "framer-motion";
import { FiCpu } from "react-icons/fi";

const LoadingMessage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start mb-4"
    >
      <div className="flex max-w-[85%] flex-row">
        {/* Avatar */}
        <div className="flex-shrink-0 mr-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary-100 text-secondary-600">
            <FiCpu size={18} />
          </div>
        </div>

        {/* Loading indicator */}
        <div>
          <div className="rounded-2xl px-4 py-3 glass-panel">
            <div className="flex items-center">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="ml-2 text-secondary-500 text-sm">
                AI is thinking...
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingMessage;
