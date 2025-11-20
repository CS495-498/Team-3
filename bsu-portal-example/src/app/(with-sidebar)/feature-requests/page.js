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
import EditDemoInstructionModal from "@/components/editDemoInstructions.jsx";
import DeleteModal from "@/components/deleteModal.jsx";
import EditFeatureRequestModal from "@/components/editFeatureRequestModal.jsx";


export default function Home() {
  const [requests, setRequests] = useState([]);
  const [votes, setVotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);

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

    const handleEditSave = (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
            const form = e.target;
            const data = new FormData(form);
            const updated = {
                ...selectedItem,
                title: data.get("title"),
                description: data.get("description"),
            };
            console.log("Edited item (placeholder):", updated);
        } else {
            console.log("Edited item (placeholder):", e);
        }
        setIsEditOpen(false);
    };

    const handleConfirmDelete = () => {
        console.log("Delete confirmed for:", selectedItem);
        setIsDeleteOpen(false);
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
          <div className="flex justify-between items-center mb-6 pt-6">
          <h1 className="text-4xl font-bold ml-4">Feature Requests</h1>
          <AddFeatureRequest
              onAdded={() =>
                  getFeatureRequests().then((reqs) => setRequests(reqs))
              }
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
                            className={`p-1 rounded-md transition ${
                                voteState === "up"
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
                            className={`p-1 rounded-md transition ${
                                voteState === "down"
                                    ? "text-red-600"
                                    : "text-gray-700 dark:text-gray-50 hover:bg-gray-200 dark:hover:bg-gray-800"
                            }`}
                            onClick={() => handleVote(req.id, "down")}
                        >
                          <ChevronsDown className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex-1 ml-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                          {req.title}{" "}
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
