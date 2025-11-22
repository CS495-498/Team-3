"use client";

import React, { useState, useEffect } from "react";
import { ChevronsUp, ChevronsDown, MessageSquare } from "lucide-react";
import SuccessToast from "@/components/ui/success-toast.jsx";


import AddFeatureRequest from "@/components/featureRequestModal";
import CommentsDialog from "@/components/commentsDialog";

import { getFeatureRequests } from "@/lib/featureRequests/requests/getFeatureRequests";
import { getUserVotes } from "@/lib/featureRequests/requests/getUserVotes";
import { castVote } from "@/lib/featureRequests/votes/castVote";
import { addComment } from "@/lib/featureRequests/comments/addComments";
import { getComments } from "@/lib/featureRequests/comments/getComments";
import CardDropdown from "@/components/cardDropdown.jsx";
import DeleteModal from "@/components/deleteModal.jsx";
import EditFeatureRequestModal from "@/components/editFeatureRequestModal.jsx";


export default function Home() {
  const [requests, setRequests] = useState([]);
  const [votes, setVotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [deleteToast, setDeleteToast] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comments, setComments] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    Promise.all([getFeatureRequests(), getUserVotes()])
      .then(([reqs, userVotes]) => {
        setRequests(reqs);
        setVotes(userVotes);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const openCommentsDialog = async (req) => {
    const data = await getComments(req.id);
    setComments(data);
    setSelectedRequest(req);
    setIsDialogOpen(true);
  };

  const openEditModal = (demo) => {
    setSelectedItem(demo);
    setIsEditOpen(true);
  };

  const openDeleteModal = (demo) => {
    setSelectedItem(demo);
    setIsDeleteOpen(true);
  };

  async function handleEditSave(updatedItem) {
    if (!updatedItem.id) return;

    const res = await fetch(`/api/feature-requests/${updatedItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedItem),
    });

    if (!res.ok) {
      let errorMessage = "Unknown error";
      try {
        const err = await res.json();
        errorMessage = err.error || JSON.stringify(err);
      } catch { }
      console.error("Error saving feature request:", errorMessage);
      return;
    }

    const updated = await res.json();

    // ✅ Update the requests state (the array actually used in the UI)
    setRequests((prev) =>
      prev.map((req) =>
        req.id === updated.id
          ? { ...updated, username: req.username, commentCount: req.commentCount }
          : req
      )
    );


    setIsEditOpen(false);
  }





  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`/api/feature-requests/${selectedItem.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Failed to delete feature request:", err.error || err);
        return;
      }

      // Remove deleted item from state
      setRequests((prev) => prev.filter((r) => r.id !== selectedItem.id));

      // Close modal
      setIsDeleteOpen(false);

      // Show toast
      setDeleteToast(true);
      setTimeout(() => setDeleteToast(false), 2000);
    } catch (error) {
      console.error("Error deleting feature request:", error);
    }
  };



  const handleAddComment = async (content) => {
    const newComment = await addComment(selectedRequest.id, content);

    setComments((prev) => [...prev, newComment]);

    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequest.id
          ? { ...r, commentCount: r.commentCount + 1 }
          : r
      )
    );
  };

  const handleVote = async (id, type) => {
    const previousVote = votes[id];

    setVotes((prev) => ({
      ...prev,
      [id]: previousVote === type ? null : type,
    }));

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        let change;

        if (previousVote === type) {
          change = type === "up" ? -1 : +1;
        } else if (previousVote) {
          change = type === "up" ? +2 : -2;
        } else {
          change = type === "up" ? +1 : -1;
        }

        return { ...r, number_of_votes: r.number_of_votes + change };
      })
    );

    const apiVote =
      previousVote === type ? "remove" : type === "up" ? "up" : "down";

    try {
      await castVote(id, apiVote);
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  if (isLoading) {
    return <div className="p-10 text-gray-500">Loading...</div>;
  }

  return (
    <main className="pt-6 px-10 min-h-screen w-full">
      <SuccessToast
        message="Feature request added!"
        isOpen={showToast}
        onClose={() => setShowToast(false)}
      />
      <SuccessToast
        message="Feature request deleted!"
        isOpen={deleteToast}
        onClose={() => setDeleteToast(false)}
      />

      <div className="flex justify-between items-center mb-6 pt-6">
        <h1 className="text-4xl font-bold ml-4">Feature Requests</h1>
        <AddFeatureRequest
          onAdded={async ({ title, content }) => {
            try {
              const res = await fetch("/api/feature-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content }),
              });

              if (!res.ok) {
                const err = await res.json();
                console.error("Failed to add feature request:", err.error || err);
                return;
              }

              const newRequest = await res.json();

              // Use the username returned from API
              const requestWithExtras = {
                ...newRequest,
                username: newRequest.username || newRequest.user?.username,
                commentCount: 0,
              };

              setRequests((prev) => [requestWithExtras, ...prev]);
              setShowToast(true);
              setTimeout(() => setShowToast(false), 2000);
            } catch (error) {
              console.error("Error adding feature request:", error);
            }
          }}
        />



      </div>

      {requests.length === 0 ? (
        <p className="text-gray-600 ml-4">No feature requests found.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {requests.map((req) => {
            const voteState = votes[req.id];

            return (
              <li
                key={req.id}
                className="flex items-center justify-between py-4 px-4 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex flex-col items-center space-y-2 ml-2">
                  <button
                    className={`p-1 rounded-md transition ${voteState === "up"
                      ? "text-green-600"
                      : "text-gray-700 dark:text-gray-50 hover:bg-gray-200 dark:hover:bg-gray-800"
                      }`}
                    onClick={() => handleVote(req.id, "up")}
                  >
                    <ChevronsUp className="w-5 h-5" />
                  </button>

                  <span className="text-sm font-medium text-gray-800 dark:text-gray-50">
                    {req.number_of_votes}
                  </span>

                  <button
                    className={`p-1 rounded-md transition ${voteState === "down"
                      ? "text-red-600"
                      : "text-gray-700 dark:text-gray-50 hover:bg-gray-200 dark:hover:bg-gray-800"
                      }`}
                    onClick={() => handleVote(req.id, "down")}
                  >
                    <ChevronsDown className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 ml-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                    <span>{req.title}</span>

                    {/* Status Tag */}
                    {req.status && (
                      <span
                        className={`
        px-2 py-0.5 text-xs font-medium rounded-full
        ${req.status === "open"
                            ? "bg-blue-100 text-blue-700"
                            : req.status === "in_progress"
                              ? "bg-yellow-100 text-yellow-700"
                              : req.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-700" // closed
                          }
      `}
                      >
                        {req.status.replace("_", " ")}
                      </span>
                    )}

                    <span className="text-sm text-gray-500">— {req.username}</span>
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-200">
                    {req.content}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Created: {new Date(req.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => openCommentsDialog(req)}
                    className="flex items-center gap-1 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-sm">{req.commentCount}</span>
                  </button>
                  <CardDropdown
                    onEdit={() => openEditModal(req)}
                    onDelete={() => openDeleteModal(req)}
                  />
                </div>
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
        onAddComment={handleAddComment}
      />
      <EditFeatureRequestModal
        isOpen={isEditOpen}
        closeModal={() => setIsEditOpen(false)}
        onSave={handleEditSave}
        item={selectedItem}
      />

      <DeleteModal
        isOpen={isDeleteOpen}
        closeModal={() => setIsDeleteOpen(false)}
        onDeleteConfirm={handleConfirmDelete}
      />
    </main>
  );
}
