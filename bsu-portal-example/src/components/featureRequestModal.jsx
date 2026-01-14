import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";

export default function AddFeatureRequest({ onAdded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null); // <-- new state for file
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!content.trim()) {
      setError("Content is required.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Call onAdded callback with file
      await onAdded({ title: title.trim(), content: content.trim(), file });

      setTitle("");
      setContent("");
      setFile(null);
      setIsOpen(false);
    } catch (err) {
      setError(err.message || "Failed to submit feature request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-10 text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition"
      >
        Add Feature Request
      </button>

      <AnimatePresence>
        {isOpen && (
          <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed inset-0 z-50">
            <motion.div
              className="fixed inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <div className="fixed inset-0 flex items-center justify-center p-6">
              <motion.div
                className="w-full max-w-lg mx-auto"
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
              >
                <Dialog.Panel className="w-full rounded-2xl bg-white dark:bg-gray-700 shadow-2xl p-8">
                  <h4 className="font-bold text-2xl mb-4 text-gray-900 dark:text-gray-100">
                    Add a New Feature Request
                  </h4>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter feature title"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        rows="4"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Describe your feature request..."
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition resize-none"
                      ></textarea>
                    </div>

                    {/* New File Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Attach a file (optional)
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full"
                        accept=".png,.jpg,.jpeg,.pdf"
                      />
                    </div>

                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition ${
                          isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                      >
                        {isSubmitting ? "Submitting..." : "Submit Feature"}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </motion.div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
