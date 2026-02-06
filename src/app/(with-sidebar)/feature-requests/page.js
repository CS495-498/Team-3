"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronsUp, ChevronsDown, MessageSquare } from "lucide-react";
import SuccessToast from "@/components/ui/success-toast.jsx";
import LoadingIndicator from "@/components/ui/loading-indicator.jsx";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import AddFeatureRequest from "@/components/featureRequestModal";
import CommentsDialog from "@/components/commentsDialog";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

import { getFeatureRequests } from "@/lib/featureRequests/requests/getFeatureRequests";
import { getUserVotes } from "@/lib/featureRequests/requests/getUserVotes";
import { castVote } from "@/lib/featureRequests/votes/castVote";
import { addComment } from "@/lib/featureRequests/comments/addComments";
import { getComments } from "@/lib/featureRequests/comments/getComments";
import CardDropdown from "@/components/cardDropdown.jsx";
import DeleteModal from "@/components/deleteModal.jsx";
import EditFeatureRequestModal from "@/components/editFeatureRequestModal.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog } from "@headlessui/react";
import {createClient} from "@/utils/Supabase/client.js";
import {onEntryChange} from "@/lib/cstack.js";


export default function Home() {
    const [currentUser, setCurrentUser] = useState(null);
    const [requests, setRequests] = useState([]);
    const [votes, setVotes] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [deleteToast, setDeleteToast] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [showCompleted, setShowCompleted] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = sessionStorage.getItem("featureRequests_showCompleted");
            return saved === "true";
        }
        return false;
    });
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [comments, setComments] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [sortOption, setSortOption] = useState("votes_desc");

    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [activeVideoSrc, setActiveVideoSrc] = useState(null);


    useEffect(() => {
        Promise.all([getFeatureRequests(), getUserVotes()])
            .then(([reqs, userVotes]) => {
                console.log("reqs", reqs);
                setRequests(reqs);

                setVotes(userVotes);
            })
            .finally(() => setIsLoading(false));
    }, []);

    // Persist showCompleted preference to sessionStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("featureRequests_showCompleted", showCompleted.toString());
        }
    }, [showCompleted]);

    useEffect(() => {
        let mounted = true;
        fetch("/api/profiles/me")
            .then((r) => r.json())
            .then((data) => {
                if (!mounted) return;
                if (!data || data?.error) {
                    setCurrentUser(null);
                } else {
                    setCurrentUser(data); // { id, username }
                }
            })
            .catch((err) => {
                console.error("Failed to load current user:", err);
                setCurrentUser(null);
            });

        return () => { mounted = false; };
    }, []);

    // Persist showCompleted preference to sessionStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("featureRequests_showCompleted", showCompleted.toString());
        }
    }, [showCompleted]);

    const filteredSortedRequests = useMemo(() => {
        let list = [...requests];

        // FILTER: Hide completed by default unless showCompleted is true
        if (!showCompleted) {
            list = list.filter((req) => req.status !== "completed");
        }

        // FILTER: Apply status filter if not "all"
        if (statusFilter !== "all") {
            list = list.filter((req) => req.status === statusFilter);
        }

        // SORT
        switch (sortOption) {
            case "votes_desc":
                list.sort((a, b) => b.number_of_votes - a.number_of_votes);
                break;

            case "votes_asc":
                list.sort((a, b) => a.number_of_votes - b.number_of_votes);
                break;

            case "newest":
                list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;

            case "oldest":
                list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;

            case "title_asc":
                list.sort((a, b) => a.title.localeCompare(b.title));
                break;

            case "title_desc":
                list.sort((a, b) => b.title.localeCompare(a.title));
                break;
        }

        return list;
    }, [requests, statusFilter, sortOption, showCompleted]);



    const { items: visibleRequests, hasMore, ref } = useInfiniteScroll(filteredSortedRequests, 6);


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

    const sameUser = (feature_request_user_id, user_id) => {
        return user_id === feature_request_user_id;
    };

    async function handleEditSave(updatedItem) {
        if(!sameUser(selectedItem.user_id, currentUser.id)) return;
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
        if(!sameUser(selectedItem.user_id, currentUser.id)) return;

        try {
            const res = await fetch(`/api/feature-requests/${selectedItem.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const err = await res.json();
                console.error("Failed to delete feature request:", err.error || err);
                return;
            }

            setRequests((prev) => prev.filter((r) => r.id !== selectedItem.id));

            setIsDeleteOpen(false);

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
        return <LoadingIndicator label="Loading feature requests..." />;
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

                <div className="flex items-center justify-between mb-4 bg-secondary/40 p-4 rounded-lg">
                    <div className="flex items-center gap-8">
                        <h1 className="text-4xl font-bold ml-4">Feature Requests</h1>
                        {/* Filter By */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Filter by:</span>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sort By */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Sort by:</span>
                            <Select value={sortOption} onValueChange={setSortOption}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="votes_desc">Most Votes</SelectItem>
                                    <SelectItem value="votes_asc">Fewest Votes</SelectItem>
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="oldest">Oldest</SelectItem>
                                    <SelectItem value="title_asc">Title A → Z</SelectItem>
                                    <SelectItem value="title_desc">Title Z → A</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Show Completed Toggle */}
                        <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-300 dark:border-gray-700">
                            <label htmlFor="show-completed" className="text-sm text-muted-foreground cursor-pointer">
                                Show completed
                            </label>
                            <Switch
                                id="show-completed"
                                checked={showCompleted}
                                onCheckedChange={setShowCompleted}
                            />
                        </div>

                    </div>
                </div>


                <AddFeatureRequest
                    onAdded={async ({ title, content, file }) => {
                        // DO NOT set local error here — let modal handle it
                        const formData = new FormData();
                        formData.append("title", title);
                        formData.append("content", content);
                        if (file) formData.append("file", file);

                        const res = await fetch("/api/feature-requests", {
                            method: "POST",
                            body: formData,
                        });

                        const data = await res.json(); // ✅ parse ONCE

                        if (!res.ok) {
                            throw new Error(data.error || "Failed to add feature request");
                        }

                        const usernameFromServer =
                            data.username || data.user?.username;
                        const username =
                            usernameFromServer || currentUser?.username || "Unknown";

                        const requestWithExtras = {
                            ...data,
                            username,
                            user: undefined,
                            commentCount: 0,
                            number_of_votes: data.number_of_votes ?? 0,
                        };

                        setRequests(prev => [requestWithExtras, ...prev]);
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 2000);
                    }}
                />


            </div>

            {visibleRequests.length === 0 ? (
                <p className="text-gray-600 ml-4">No feature requests found.</p>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {visibleRequests.map((req) => {
                        const voteState = votes[req.id];

                        const isImage = (url) => {
                            if (!url) return false;
                            const path = url.split("?")[0]; // remove ?token=...
                            return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
                        };

                        const isPDF = (url) => {
                            if (!url) return false;
                            const path = url.split("?")[0];
                            return /\.pdf$/i.test(path);
                        };

                        const isVideo = (url) => {
                            if (!url) return false;
                            const path = url.split("?")[0];
                            return /\.(mp4|webm|ogg)$/i.test(path);
                        }


                        const isCompleted = req.status === "completed";
                        
                        return (
                            <li
                                key={req.id}
                                className={`flex items-center py-4 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                    isCompleted ? "opacity-60 dark:opacity-50" : ""
                                }`}
                            >
                                {/* Votes */}
                                <div className="flex flex-col items-center space-y-2 mr-4">
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

                                {/* File / Image / Video / Placeholder */}
                                <div className="flex-shrink-0 flex items-center justify-center mr-4">
                                    {req.signed_file_url ? (
                                        <>
                                            {isImage(req.signed_file_url) && (
                                                <img
                                                    src={req.signed_file_url}
                                                    alt="Attached"
                                                    className="w-16 h-16 object-cover rounded-lg cursor-pointer border border-gray-200 dark:border-gray-700"
                                                    onClick={() => window.open(req.signed_file_url, "_blank")}
                                                    title="Click to enlarge image"
                                                />
                                            )}
                                            {isPDF(req.signed_file_url) && (
                                                <img
                                                    src="/pdf-icon.png"
                                                    alt="PDF"
                                                    className="w-16 h-16 object-cover rounded-lg cursor-pointer border border-gray-200 dark:border-gray-700"
                                                    onClick={() => window.open(req.signed_file_url, "_blank")}
                                                    title="Click to view PDF"
                                                />
                                            )}

                                            {isVideo(req.signed_file_url) && (
                                                <div className="relative w-16 h-16">
                                                    <video
                                                        src={req.signed_file_url}
                                                        className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                                                        muted
                                                        loop
                                                        playsInline
                                                        onMouseEnter={(e) => e.currentTarget.play()}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.pause();
                                                            e.currentTarget.currentTime = 0;
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-white text-xl hover:bg-black/50 transition"
                                                        title="Play video"
                                                        onClick={() => {
                                                            setActiveVideoSrc(req.signed_file_url);
                                                            setVideoModalOpen(true);
                                                        }}
                                                    >
                                                        ▶
                                                    </button>
                                                </div>


                                            )}
                                        </>
                                    ) : (
                                        // Placeholder icon for requests without files
                                        <button
                                            onClick={() => openCommentsDialog(req)}
                                            className="w-16 h-16 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                            title="Add/view comments"
                                        >
                                            <MessageSquare className="w-10 h-10 text-gray-600 dark:text-gray-300" />
                                        </button>
                                    )}
                                </div>


                                {/* Content */}
                                <div className="flex-1 flex flex-col gap-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                                        <span>{req.title}</span>
                                        {req.status && (
                                            <span
                                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${req.status === "open"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : req.status === "in_progress"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : req.status === "completed"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-200 text-gray-700"
                                                    }`}
                                            >
                                                {req.status.replace("_", " ")}
                                            </span>
                                        )}
                                        <span className="text-sm text-gray-500">— {req.username}</span>
                                    </h3>

                                    <p className="text-sm text-gray-600 dark:text-gray-200">{req.content}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Created: {new Date(req.created_at).toLocaleString()}
                                    </p>
                                </div>

                                {/* Comments & dropdown */}
                                <div className="flex justify-between items-center ml-4">
                                    <div className={!sameUser(req.user_id, currentUser.id) ? 'hidden' : ''}>
                                        <CardDropdown
                                            onEdit={() => openEditModal(req)}
                                            onDelete={() => openDeleteModal(req)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => openCommentsDialog(req)}
                                        className="flex items-center gap-1 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                        <MessageSquare className="w-5 h-5"/>
                                        <span className="text-sm">{req.commentCount}</span>
                                    </button>
                                </div>
                            </li>
                        );
                    })}

                </ul>

            )}

            {hasMore && (
                <div ref={ref} className="flex flex-col justify-center items-center py-8 mt-6">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div
                            className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Loading more requests...</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Showing {visibleRequests.length} of {requests.length} requests
                    </p>
                </div>
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
            {/* Video Fullscreen Modal */}
            <AnimatePresence>
                {videoModalOpen && (
                    <Dialog
                        open={videoModalOpen}
                        onClose={() => setVideoModalOpen(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    >
                        <motion.div
                            className="w-full max-w-3xl"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Dialog.Panel className="relative w-full">
                                {/* Close Button */}
                                <button
                                    className="absolute top-4 right-4 text-white text-2xl z-10"
                                    onClick={() => setVideoModalOpen(false)}
                                    title="Close video"
                                >
                                    ×
                                </button>

                                {/* Video */}
                                <video
                                    src={activeVideoSrc}
                                    className="w-full h-auto max-h-screen rounded-lg"
                                    controls
                                    autoPlay
                                />
                            </Dialog.Panel>
                        </motion.div>
                    </Dialog>
                )}
            </AnimatePresence>

        </main>
    );
}
