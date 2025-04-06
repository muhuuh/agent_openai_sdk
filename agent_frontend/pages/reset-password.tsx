import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion } from "framer-motion";
import { FiLock, FiArrowRight, FiAlertCircle } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { supabase } = useAuth();

  useEffect(() => {
    // Check if we have a hash fragment in the URL (from email link)
    const hash = window.location.hash;
    if (!hash) {
      setMessage("Please use the link from the reset password email");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage("Password has been updated successfully!");
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 p-4">
      <Head>
        <title>Reset Password | AI Agent Assistant</title>
      </Head>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-8 rounded-2xl max-w-md w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">
            <span className="text-primary-500 bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-violet-500">
              AI
            </span>{" "}
            Agent Assistant
          </h1>
          <p className="text-secondary-600">Reset your password</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-secondary-700 mb-1"
            >
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-secondary-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-secondary-700 mb-1"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-secondary-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="inline-flex items-center">
                  Reset Password
                  <FiArrowRight className="ml-2" />
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-secondary-200 text-center">
          <Link href="/login">
            <span className="text-primary-600 hover:text-primary-800 font-semibold">
              Back to sign in
            </span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
