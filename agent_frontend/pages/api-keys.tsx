import { useState, useEffect } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { FiPlus, FiTrash2, FiEdit2, FiCopy, FiArrowLeft } from "react-icons/fi";
import NavBar from "../components/NavBar";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

// Types
interface ApiKey {
  id: string;
  name: string;
  token: string;
  created_at: string;
  user_id: string;
}

export default function ApiKeysPage() {
  const { supabase, user, loading: authLoading } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyToken, setNewKeyToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch API keys on component mount and when user changes
  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  async function fetchApiKeys() {
    if (!user) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("todo_api_keys")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setApiKeys(data || []);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      setErrorMessage("Failed to load API keys. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function addApiKey() {
    if (!user) {
      setErrorMessage("You must be logged in to add API keys");
      return;
    }

    if (!newKeyName.trim() || !newKeyToken.trim()) {
      setErrorMessage("Name and API token are required");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("todo_api_keys")
        .insert([
          {
            name: newKeyName.trim(),
            token: newKeyToken.trim(),
            user_id: user.id,
          },
        ])
        .select();

      if (error) throw error;

      setApiKeys([...(data || []), ...apiKeys]);
      setNewKeyName("");
      setNewKeyToken("");
      setSuccessMessage("API key added successfully");

      // Refresh the list
      fetchApiKeys();
    } catch (error) {
      console.error("Error adding API key:", error);
      setErrorMessage("Failed to add API key. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function updateApiKey(id: string) {
    if (!user) {
      setErrorMessage("You must be logged in to update API keys");
      return;
    }

    if (!editName.trim()) {
      setErrorMessage("Name is required");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("todo_api_keys")
        .update({ name: editName.trim() })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setApiKeys(
        apiKeys.map((key) =>
          key.id === id ? { ...key, name: editName.trim() } : key
        )
      );

      setEditingKey(null);
      setEditName("");
      setSuccessMessage("API key updated successfully");
    } catch (error) {
      console.error("Error updating API key:", error);
      setErrorMessage("Failed to update API key. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteApiKey(id: string) {
    if (!user) {
      setErrorMessage("You must be logged in to delete API keys");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this API key? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("todo_api_keys")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setApiKeys(apiKeys.filter((key) => key.id !== id));
      setSuccessMessage("API key deleted successfully");
    } catch (error) {
      console.error("Error deleting API key:", error);
      setErrorMessage("Failed to delete API key. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setSuccessMessage("API key copied to clipboard");
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
        <div className="text-primary-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
        <div className="glass-panel p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">
            Authentication Required
          </h1>
          <p className="mb-6">You need to be logged in to manage API keys.</p>
          <Link href="/">
            <span className="btn-primary inline-block">Go to Login</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
        <Head>
          <title>Manage API Keys | AI Agent Assistant</title>
          <meta
            name="description"
            content="Manage your API keys for the AI Agent Assistant"
          />
        </Head>

        <NavBar />

        <main className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <Link href="/">
              <span className="inline-flex items-center text-primary-600 hover:text-primary-700 cursor-pointer">
                <FiArrowLeft className="mr-2" /> Back to Chat
              </span>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-panel p-6 rounded-2xl max-w-3xl mx-auto"
          >
            <h1 className="text-2xl font-semibold mb-6">Manage API Keys</h1>

            {errorMessage && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                {successMessage}
              </div>
            )}

            {/* Add new API key form */}
            <div className="mb-8 p-4 bg-white bg-opacity-50 rounded-xl">
              <h2 className="text-lg font-medium mb-4">Add New API Key</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="keyName"
                    className="block text-sm font-medium text-secondary-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="keyName"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Enter a descriptive name"
                    className="input"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label
                    htmlFor="keyToken"
                    className="block text-sm font-medium text-secondary-700 mb-1"
                  >
                    API Token
                  </label>
                  <input
                    type="text"
                    id="keyToken"
                    value={newKeyToken}
                    onChange={(e) => setNewKeyToken(e.target.value)}
                    placeholder="Paste your API token here"
                    className="input"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={addApiKey}
                  disabled={
                    isLoading || !newKeyName.trim() || !newKeyToken.trim()
                  }
                  className="btn-primary flex items-center"
                >
                  <FiPlus className="mr-2" /> Add API Key
                </button>
              </div>
            </div>

            {/* API keys list */}
            <div>
              <h2 className="text-lg font-medium mb-4">Your API Keys</h2>

              {isLoading && <p className="text-secondary-500">Loading...</p>}

              {!isLoading && apiKeys.length === 0 && (
                <p className="text-secondary-500">
                  You don't have any API keys yet.
                </p>
              )}

              <ul className="space-y-3">
                {apiKeys.map((key) => (
                  <li
                    key={key.id}
                    className="bg-white bg-opacity-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {editingKey === key.id ? (
                          <div className="flex items-center mb-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="input mr-2"
                              autoFocus
                            />
                            <button
                              onClick={() => updateApiKey(key.id)}
                              disabled={isLoading}
                              className="btn-primary"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingKey(null);
                                setEditName("");
                              }}
                              className="btn-secondary ml-2"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="font-medium text-secondary-800">
                            {key.name}
                          </div>
                        )}
                        <div className="text-sm text-secondary-500 mt-1">
                          Added on{" "}
                          {new Date(key.created_at).toLocaleDateString()}
                        </div>
                        <div className="mt-2 flex items-center">
                          <div className="bg-secondary-100 px-3 py-1 rounded-md font-mono text-sm text-secondary-800 mr-2 flex-1 truncate">
                            {key.token.substring(0, 10)}...
                            {key.token.substring(key.token.length - 5)}
                          </div>
                          <button
                            onClick={() => copyToClipboard(key.token)}
                            className="p-2 text-primary-500 hover:text-primary-600"
                            title="Copy API Key"
                          >
                            <FiCopy size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="flex ml-4">
                        {editingKey !== key.id && (
                          <button
                            onClick={() => {
                              setEditingKey(key.id);
                              setEditName(key.name);
                            }}
                            className="p-2 text-secondary-500 hover:text-secondary-700"
                            title="Edit API Key Name"
                          >
                            <FiEdit2 size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteApiKey(key.id)}
                          className="p-2 text-red-500 hover:text-red-600"
                          title="Delete API Key"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
