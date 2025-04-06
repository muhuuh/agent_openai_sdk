import { useState } from "react";
import { motion } from "framer-motion";
import { FiUser, FiSettings, FiLogOut, FiKey } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

interface NavBarProps {
  userEmail?: string;
  onLogout?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ userEmail, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const { user, signOut } = useAuth();

  const email = userEmail || user?.email || "User";

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await signOut();
      router.push("/");
    }
    // Close dropdown after action
    setDropdownOpen(false);
  };

  const handleApiKeys = () => {
    router.push("/api-keys");
    setDropdownOpen(false);
  };

  return (
    <nav className="w-full px-6 py-4 flex items-center justify-between">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/">
          <span className="text-xl md:text-2xl font-semibold text-secondary-900 cursor-pointer">
            <span className="text-primary-500 bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-violet-500">
              AI
            </span>{" "}
            Agent Assistant
          </span>
        </Link>
      </motion.div>

      <div className="relative">
        <button
          onClick={toggleDropdown}
          className="flex items-center space-x-2 p-2 rounded-full hover:bg-secondary-100 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600 flex items-center justify-center">
            <FiUser size={18} />
          </div>
          <span className="hidden md:block text-sm text-secondary-700">
            {email}
          </span>
        </button>

        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 glass-panel z-10 divide-y divide-gray-100"
          >
            <ul className="py-2 text-sm text-secondary-700">
              <li>
                <button
                  onClick={handleApiKeys}
                  className="w-full text-left px-4 py-2 hover:bg-secondary-100 flex items-center space-x-2"
                >
                  <FiKey className="text-primary-500" />
                  <span>API Keys</span>
                </button>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-secondary-100 flex items-center space-x-2"
                >
                  <FiLogOut className="text-primary-500" />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
