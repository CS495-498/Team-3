"use client";

import { useState } from "react";
import { Dialog, DialogTitle } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";

export default function CommentsDialog({
                                           isOpen,
                                           onClose,
                                           request,
                                           comments,
                                           onAddComment,
                                       }) {
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        await onAddComment(newComment);
        setNewComment("");
        setIsSubmitting(false);
    };

    if (!request) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50">
                    <motion.div
                        className="fixed inset-0 bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            className="w-full sm:max-w-4xl mx-auto"
                            initial={{ opacity: 0, scale: 0.96, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -8 }}
                        >
                            <Dialog.Panel className="rounded-2xl bg-white dark:bg-gray-900 p-4 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[95vh] overflow-y-auto">
                                <DialogTitle className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                    {request.title || "Untitled Feature Request"}
                                </DialogTitle>

                                <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                                    {request.content || "No description provided."}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-400 mb-4">
                                    Created: {new Date(request.created_at).toLocaleString()}
                                </p>

                                <h4 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Comments ({comments.length})
                                </h4>

                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-3 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-800 mb-4">
                                    {comments.length > 0 ? (
                                        <ul className="space-y-1">
                                            {comments.map((c) => (
                                                <li
                                                    key={c.id}
                                                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3"
                                                >
                                                    <p className="font-semibold text-sm">
                                                        {c.user?.username ?? "Anonymous"}
                                                    </p>
                                                    <p className="text-gray-800 dark:text-gray-200 text-sm sm:text-base">
                                                        {c.content}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(c.created_at).toLocaleString()}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500 text-sm italic">No comments yet.</p>
                                    )}
                                </div>

                                <textarea
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 text-sm sm:text-base text-gray-900 dark:text-gray-100 resize-none"
                                    rows="3"
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />

                                <div className="mt-4 flex justify-end gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className={`text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition ${
                                            isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                                        }`}
                                    >
                                        {isSubmitting ? "Posting..." : "Post Comment"}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </motion.div>
                    </div>
                </Dialog>
            )}
        </AnimatePresence>
    );
}
