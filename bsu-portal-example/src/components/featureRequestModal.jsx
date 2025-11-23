"use client";
import { Fragment, useState } from "react";
import { Dialog } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";


export default function AddFeatureRequest() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Please fill out both fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch("/api/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Title: title.trim(),
          Content: content.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit feature request.");
      }

      setIsOpen(false);
      setTitle("");
      setContent("");
      // Optionally refresh your feature request list here
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-10 text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition"
      >
          Add Feature Request
      </button>

        <AnimatePresence>
            {isOpen && (
                <Dialog
                    className="fixed inset-0 z-50"
                    open={isOpen}
                    onClose={() => setIsOpen(false)}
                >
                    <motion.div
                        className="fixed inset-0 bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        aria-hidden="true"
                    />

                    <div className="fixed inset-0 flex items-center justify-center p-6">
                        <motion.div
                            className="w-full max-w-lg mx-auto"
                            initial={{ opacity: 0, scale: 0.96, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -8 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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

                                    {error && (
                                        <p className="text-red-500 text-sm font-medium">{error}</p>
                                    )}

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
                                                isSubmitting && "opacity-70 cursor-not-allowed"
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
