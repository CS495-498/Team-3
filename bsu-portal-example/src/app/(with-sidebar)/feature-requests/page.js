"use client";

import { useState, useEffect } from "react";
import { ChevronsUp, ChevronsDown, MessageSquare } from "lucide-react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import AddFeatureRequest from "@/components/featureRequestModal";
import CommentsDialog from "@/components/commentsDialog";
export default function Home() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votes, setVotes] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comments, setComments] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all feature requests
  const getContent = async () => {
    try {
      const res = await fetch("/api/feature-requests");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      // Optionally include comment counts
      const requestsWithCounts = await Promise.all(
        data.map(async (req) => {
          const resComments = await fetch(`/api/feature-requests/${req.id}/comments`);
          const commentsData = await resComments.json();
          return { ...req, commentCount: commentsData.length || 0 };
        })
      );

      setRequests(requestsWithCounts);
    } catch (error) {
      console.error("Error fetching feature requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getContent();
  }, []);

  // Fetch comments for a specific feature request
  const openCommentsDialog = async (request) => {
    try {
      const res = await fetch(`/api/feature-requests/${request.id}/comments`);
      const data = await res.json();
      setComments(data);
      setSelectedRequest(request);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // Add a new comment via POST API
  const addComment = async (content) => {
  if (!selectedRequest) return;

  try {
    const res = await fetch(`/api/feature-requests/${selectedRequest.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const error = await res.json();
      alert(`Error: ${error.error || "Failed to post comment"}`);
      return;
    }

    const newCommentData = await res.json();

    setComments((prev) =>
      Array.isArray(prev) ? [...prev, newCommentData] : [newCommentData]
    );

    // Update comment count in main list
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequest.id
          ? { ...r, commentCount: (r.commentCount || 0) + 1 }
          : r
      )
    );
  } catch (error) {
    console.error("Error adding comment:", error);
  }
};

  const handleVote = (id, type) => {
    setVotes((prev) => {
      const current = prev[id];
      if (current === type) return { ...prev, [id]: null };
      return { ...prev, [id]: type };
    });
  };

  if (isLoading)
    return <div className="p-10 text-gray-500">Loading...</div>;

  return (
    <main className="pt-6 px-10 min-h-screen w-full">
      <div className="flex justify-between items-center mb-6 pt-6">
        <h1 className="text-4xl font-bold ml-4">Feature Requests</h1>
        <AddFeatureRequest onAdded={() => getContent()} />
      </div>

      {requests.length === 0 ? (
        <p className="text-gray-600 ml-4">No feature requests found.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {requests.map((req, idx) => {
            const voteState = votes[req.id];
            return (
              <li
                key={req.id || idx}
                className="flex items-center justify-between py-4 px-4 transition-colors
                           hover:bg-gray-100 dark:hover:bg-gray-800
                           odd:bg-gray-50 even:bg-white
                           dark:odd:bg-gray-900 dark:even:bg-gray-950"
              >
                {/* Left: Voting buttons */}
                <div className="flex flex-col items-center space-y-2 ml-2">
                  <button
                    className={`p-1 rounded-md transition ${voteState === "up"
                        ? "text-green-600"
                        : "text-gray-700 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    onClick={() => handleVote(req.id, "up")}
                  >
                    <ChevronsUp className="w-5 h-5" />
                  </button>

                  <span className="text-sm font-medium text-gray-800 dark:text-gray-50">
                    {req.number_of_votes ?? 0}
                  </span>

                  <button
                    className={`p-1 rounded-md transition ${voteState === "down"
                        ? "text-red-600"
                        : "text-gray-700 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    onClick={() => handleVote(req.id, "down")}
                  >
                    <ChevronsDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Middle: Request info */}
                <div className="flex-1 ml-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    {req.title || "Untitled Request"}{" "}
                    <span className="text-sm text-gray-500">
                      — {req.user_id || "Anonymous"}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-200">
                    {req.content || "No description provided."}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {new Date(req.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Right: Comments button */}
                <button
                  onClick={() => openCommentsDialog(req)}
                  className="flex items-center gap-1 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-sm">{req.commentCount ?? 0}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <CommentsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        request={selectedRequest}
        comments={comments}
        onAddComment={addComment}
      />

    </main>
  );
}
