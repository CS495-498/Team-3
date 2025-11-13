"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

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
    await onAddComment(newComment); // Pass new comment back to parent
    setNewComment("");
    setIsSubmitting(false);
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <DialogPanel className="mx-auto w-full sm:max-w-4xl rounded-2xl bg-white dark:bg-gray-900 p-4 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[95vh] overflow-y-auto">
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

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-800 mb-4">
            {comments.length > 0 ? (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3"
                  >
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
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-3 text-sm sm:text-base text-gray-900 dark:text-gray-100 bg-transparent resize-none"
            rows="3"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition"
            >
              Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-md text-white transition ${
                isSubmitting ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
