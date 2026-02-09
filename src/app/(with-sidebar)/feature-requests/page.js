"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import DOMPurify from "isomorphic-dompurify";
import { ChevronsUp, ChevronsDown, MessageSquare } from "lucide-react";
import SuccessToast from "@/components/ui/success-toast.jsx";
import LoadingIndicator from "@/components/ui/loading-indicator.jsx";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"

import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

import { getFeatureRequests } from "@/lib/featureRequests/requests/getFeatureRequests";
import { getUserVotes } from "@/lib/featureRequests/requests/getUserVotes";
import { castVote } from "@/lib/featureRequests/votes/castVote";
import { addComment } from "@/lib/featureRequests/comments/addComments";
import { getComments } from "@/lib/featureRequests/comments/getComments";

import CardDropdown from "@/components/cardDropdown.jsx";
import DeleteModal from "@/components/deleteModal.jsx";

import { motion, AnimatePresence } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

import { useUser } from "@/context/UserContext";
import { hasPermission } from "@/utils/hasPermission";
import PERMISSIONS from "@/config/permissions";

import { createClient } from "@/utils/Supabase/client.js";
import { onEntryChange } from "@/lib/cstack.js";


export default function Home() {
    const [currentUser, setCurrentUser] = useState(null);
    const [requests, setRequests] = useState([]);
    const [votes, setVotes] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const [deleteToast, setDeleteToast] = useState(false);

    const [statusFilter, setStatusFilter] = useState("all");
    const [sortOption, setSortOption] = useState("votes_desc");

    const [showCompleted, setShowCompleted] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = sessionStorage.getItem("featureRequests_showCompleted");
            return saved === "true";
        }
        return false;
    });
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [activeVideoSrc, setActiveVideoSrc] = useState(null);

    // Full request viewer
    const { user, loading: userLoading } = useUser();

    const canManageAll =
        !!user && hasPermission(user.role, PERMISSIONS.MANAGE_ALL_FEATURE_REQUESTS);

    const canPublish =
        !!user && hasPermission(user.role, PERMISSIONS.PUBLISH_FEATURE_REQUESTS);

    const canEditRequest = (request) => {
        if (!user) return false;

        // Admins
        if (canManageAll) return true;

        // Normal users → only their own
        return canPublish && request.user_id === user.id;
    };


    // ✅ NEW: “open feature request to see whole thing”
    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [activeRequest, setActiveRequest] = useState(null);

    // Comments in full request viewer
    const [commentText, setCommentText] = useState("");
    const [commentPostError, setCommentPostError] = useState("");

    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);

    // Add/Edit RTE modal (Demo Instructions style)
    const [rteModalOpen, setRteModalOpen] = useState(false);
    const [rteMode, setRteMode] = useState("add"); // "add" | "edit"
    const [rteTitle, setRteTitle] = useState("");
    const [rteError, setRteError] = useState("");
    const [dialogEditorContent, setDialogEditorContent] = useState("");
    const editorRef = useRef(null);

    useEffect(() => {
        Promise.all([getFeatureRequests(), getUserVotes()])
            .then(([reqs, userVotes]) => {
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
                if (!data || data?.error) setCurrentUser(null);
                else setCurrentUser(data); // { id, username }
            })
            .catch((err) => {
                console.error("Failed to load current user:", err);
                setCurrentUser(null);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const sameUser = (feature_request_user_id, user_id) => user_id === feature_request_user_id;

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
            default:
                break;
        }

        return list;
    }, [requests, statusFilter, sortOption, showCompleted]);



    const { items: visibleRequests, hasMore, ref } = useInfiniteScroll(
        filteredSortedRequests,
        6
    );

    const isImage = (url) => {
        if (!url) return false;
        const path = url.split("?")[0];
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
    };

    const isPDF = (url) => {
        if (!url) return false;
        const path = url.split("?")[0];
        return /\.pdf$/i.test(path);

    const openCommentsDialog = async (req) => {
        const data = await getComments(req.id);
        setComments(data);
        setSelectedRequest(req);
        setIsDialogOpen(true);
    };

    const isVideo = (url) => {
        if (!url) return false;
        const path = url.split("?")[0];
        return /\.(mp4|webm|ogg)$/i.test(path);
    };

    // Allow embedded media/files in HTML
    const sanitizeHTML = (html) =>
        DOMPurify.sanitize(html || "", {
            ADD_TAGS: ["iframe", "video", "source"],
            ADD_ATTR: [
                "allow",
                "allowfullscreen",
                "frameborder",
                "scrolling",
                "src",
                "srcset",
                "type",
                "controls",
                "poster",
            ],
        });

    const openDeleteModal = (req) => {
        setSelectedItem(req);
        setIsDeleteOpen(true);
    };

    const sameUser = (feature_request_user_id, user_id) => {
        return user_id === feature_request_user_id;
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

        setRequests((prev) =>
            prev.map((req) =>
                req.id === updated.id
                    ? { ...updated, username: req.username, commentCount: req.commentCount }
                    : req
            )
        );

        // keep modal view in sync if it’s open for this request
        setActiveRequest((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));

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

            setRequests((prev) => prev.filter((r) => r.id !== selectedItem.id));

            if (activeRequest?.id === selectedItem.id) {
                setIsRequestOpen(false);
                setActiveRequest(null);
            }

            setIsDeleteOpen(false);

            setDeleteToast(true);
            setTimeout(() => setDeleteToast(false), 2000);
        } catch (error) {
            console.error("Error deleting feature request:", error);
        }
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
                if (previousVote === type) change = type === "up" ? -1 : +1;
                else if (previousVote) change = type === "up" ? +2 : -2;
                else change = type === "up" ? +1 : -1;

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

    // Open full request viewer + load comments so user can comment below the HTML
    const openRequest = async (req) => {
        setActiveRequest(req);
        setIsRequestOpen(true);

        setCommentsLoading(true);
        try {
            const data = await getComments(req.id);
            setComments(data || []);
        } catch (e) {
            console.error("Failed to load comments:", e);
            setComments([]);
        } finally {
            setCommentsLoading(false);
        }
    };

    // Add/Edit RTE triggers
    const openAddRte = () => {
        setRteError("");
        setRteMode("add");
        setSelectedItem(null);
        setRteTitle("");
        setDialogEditorContent("");
        setRteModalOpen(true);
    };

    const openEditRte = (req) => {
        setRteError("");
        setRteMode("edit");
        setSelectedItem(req);
        setRteTitle(req?.title || "");
        setDialogEditorContent(req?.content || "");
        setRteModalOpen(true);
    };

    // Save feature request from RTE (no attachments: embed links/media in HTML)
    const handleRteSave = async () => {
        setRteError("");

        const html = editorRef.current?.getHTML?.() ?? "";
        const title = (rteTitle || "").trim();

        if (!title) {
            setRteError("Title is required.");
            return;
        }

        try {
            if (rteMode === "add") {
                // ✅ no file uploads now — content is embedded via HTML
                const res = await fetch("/api/feature-requests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, content: html }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Failed to add feature request");
                }

                const usernameFromServer = data.username || data.user?.username;
                const username = usernameFromServer || currentUser?.username || "Unknown";

                const requestWithExtras = {
                    ...data,
                    username,
                    user: undefined,
                    commentCount: 0,
                    number_of_votes: data.number_of_votes ?? 0,
                };

                setRequests((prev) => [requestWithExtras, ...prev]);
                setRteModalOpen(false);

                setShowToast(true);
                setTimeout(() => setShowToast(false), 2000);
                return;
            }

            // edit
            if (rteMode === "edit") {
                if (!selectedItem || !currentUser) return;
                if (!sameUser(selectedItem.user_id, currentUser.id)) return;

                const payload = {
                    ...selectedItem,
                    title,
                    content: html,
                };

                const res = await fetch(`/api/feature-requests/${selectedItem.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    let errorMessage = "Unknown error";
                    try {
                        const err = await res.json();
                        errorMessage = err.error || JSON.stringify(err);
                    } catch {}
                    throw new Error(errorMessage);
                }

                const updated = await res.json();

                setRequests((prev) =>
                    prev.map((req) =>
                        req.id === updated.id
                            ? { ...updated, username: req.username, commentCount: req.commentCount }
                            : req
                    )
                );

                setActiveRequest((prev) =>
                    prev?.id === updated.id ? { ...prev, ...updated } : prev
                );

                setRteModalOpen(false);
            }
        } catch (e) {
            console.error(e);
            setRteError(e?.message || "Failed to save. Check console for details.");
        }
    };

    // Add comment directly under full request HTML
    const handleAddCommentInline = async () => {
        if (!activeRequest?.id) return;

        setCommentPostError("");
        const text = (commentText || "").trim();

        if (!text) {
            setCommentPostError("Comment cannot be empty.");
            return;
        }

        try {
            // send as plain text (your addComment() should accept this)
            const newComment = await addComment(activeRequest.id, text);

            setComments((prev) => [...prev, newComment]);

            setRequests((prev) =>
                prev.map((r) =>
                    r.id === activeRequest.id
                        ? { ...r, commentCount: (r.commentCount || 0) + 1 }
                        : r
                )
            );

            setActiveRequest((prev) =>
                prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev
            );

            setCommentText("");
        } catch (e) {
            console.error("Failed to post comment:", e);
            setCommentPostError("Failed to post comment. Please try again.");
        }
    };




    if (isLoading || userLoading) {
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

                {canPublish && (
                    <button
                        onClick={openAddRte}
                        type="button"
                        className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                    >
                        Add Feature Request
                    </button>
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

                                const data = await res.json();

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
                    )}
                )}



            </div>

            {visibleRequests.length === 0 ? (
                <p className="text-gray-600 ml-4">No feature requests found.</p>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {visibleRequests.map((req) => {
                        const voteState = votes[req.id];

                        // 1-line ellipsis preview: strip tags to text and truncate
                        const previewText = (req.content || "")
                            .replace(/<[^>]*>/g, " ")
                            .replace(/\s+/g, " ")
                            .trim();

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
                                        <div
                                            className="w-16 h-16 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                            title="No attachment"
                                        // Placeholder icon for requests without files
                                        <button
                                            onClick={() => openCommentsDialog(req)}
                                            className="w-16 h-16 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                            title="Add/view comments"
                                        >
                                            <MessageSquare className="w-10 h-10 text-gray-600 dark:text-gray-300" />
                                        </div>
                                    )}
                                </div>


                                {/* Content */}
                                <div className="flex-1 flex flex-col gap-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openRequest(req)}
                                            className="text-left hover:underline truncate max-w-[60ch]"
                                            title="Open feature request"
                                        >
                                            {req.title}
                                        </button>

                                        {req.status && (
                                            <span
                                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                                    req.status === "open"
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

                                    {/* ✅ 1-line ellipsis preview (no gradient overlay, no blue "view" link) */}
                                    <button
                                        type="button"
                                        onClick={() => openRequest(req)}
                                        className="text-left"
                                        title="Open feature request"
                                    >
                                        <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
                                            {previewText || "No description"}
                                        </p>
                                    </button>

                                    <p className="text-xs text-gray-400 mt-1">
                                        Created: {new Date(req.created_at).toLocaleString()}
                                    </p>
                                </div>

                                {/* Dropdown + comment count */}
                                <div className="flex justify-between items-center ml-4 gap-2">
                                    <div className={!sameUser(req.user_id, currentUser?.id) ? "hidden" : ""}>
                                        {canEditRequest(req) && (
                                            <CardDropdown
                                                onEdit={() => openEditRte(req)}
                                                onDelete={() => openDeleteModal(req)}
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-200">
                                        <MessageSquare className="w-5 h-5" />
                                        <span className="text-sm">{req.commentCount}</span>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {hasMore && (
                <div ref={ref} className="flex flex-col justify-center items-center py-8 mt-6">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Loading more requests...</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Showing {visibleRequests.length} of {requests.length} requests
                    </p>
                </div>
            )}

            <DeleteModal
                isOpen={isDeleteOpen}
                closeModal={() => setIsDeleteOpen(false)}
                onDeleteConfirm={handleConfirmDelete}
            />

            {/* Add/Edit RTE Modal (Demo Instructions style) */}
            <AnimatePresence>
                {rteModalOpen && (
                    <Dialog
                        className="fixed inset-0 z-50"
                        open={rteModalOpen}
                        onClose={() => setRteModalOpen(false)}
                    >
                        <motion.div
                            className="fixed inset-0 bg-black/50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            aria-hidden="true"
                        />

                        <div className="fixed inset-0 flex items-center justify-center p-6">
                            <motion.div
                                className="w-full max-w-5xl mx-auto"
                                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <Dialog.Panel className="w-full h-[95vh] max-h-[95vh] flex flex-col bg-white dark:bg-gray-700 rounded-xl shadow-2xl overflow-hidden">
                                    <div className="sticky top-0 bg-white dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600 z-10 flex items-center justify-between">
                                        <Dialog.Title className="font-bold text-2xl">
                                            {rteMode === "add" ? "Add Feature Request" : "Edit Feature Request"}
                                        </Dialog.Title>

                                        <div className="flex items-center gap-3">
                                            {rteError && (
                                                <p className="text-red-500 text-sm max-w-[50ch] truncate">
                                                    {rteError}
                                                </p>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setRteModalOpen(false)}
                                                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleRteSave}
                                                className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-8 space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                Title
                                            </label>
                                            <input
                                                value={rteTitle}
                                                onChange={(e) => setRteTitle(e.target.value)}
                                                type="text"
                                                placeholder="Enter title"
                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                Content
                                            </label>
                                            <div className="w-full min-h-[300px] rounded-md p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                                                <SimpleEditor html={dialogEditorContent} editorRef={editorRef} />
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
                                                Tip: embed files/media by pasting links or using your editors embed options.
                                            </p>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </motion.div>
                        </div>
                    </Dialog>
                )}
            </AnimatePresence>

            {/* Full Feature Request Modal + comments directly below HTML */}
            <AnimatePresence>
                {isRequestOpen && activeRequest && (
                    <Dialog
                        open={isRequestOpen}
                        onClose={() => setIsRequestOpen(false)}
                        className="fixed inset-0 z-50"
                    >
                        <motion.div
                            className="fixed inset-0 bg-black/50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            aria-hidden="true"
                        />

                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <motion.div
                                className="w-full max-w-3xl"
                                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-50 truncate">
                                                {activeRequest.title}
                                            </Dialog.Title>
                                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                {activeRequest.status && (
                                                    <span
                                                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                                            activeRequest.status === "open"
                                                                ? "bg-blue-100 text-blue-700"
                                                                : activeRequest.status === "in_progress"
                                                                    ? "bg-yellow-100 text-yellow-700"
                                                                    : activeRequest.status === "completed"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : "bg-gray-200 text-gray-700"
                                                        }`}
                                                    >
                            {activeRequest.status.replace("_", " ")}
                          </span>
                                                )}
                                                <span>— {activeRequest.username}</span>
                                            </div>
                                        </div>

                                        <button
                                            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-2xl leading-none"
                                            onClick={() => setIsRequestOpen(false)}
                                            title="Close"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div className="p-5 max-h-[75vh] overflow-y-auto space-y-6">
                                        <article className="prose dark:prose-invert max-w-none">
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: sanitizeHTML(activeRequest.content || ""),
                                                }}
                                            />
                                        </article>

                                        {/* Comments BELOW the HTML */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    Comments ({activeRequest.commentCount || 0})
                                                </h4>
                                                <span className="text-xs text-gray-400">
                          Created: {new Date(activeRequest.created_at).toLocaleString()}
                        </span>
                                            </div>

                                            {/* existing comments */}
                                            {commentsLoading ? (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Loading comments...</p>
                                            ) : comments.length === 0 ? (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {comments.map((c) => (
                                                        <div
                                                            key={c.id}
                                                            className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800"
                                                        >
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                                {c.username || c.user_id || "User"} •{" "}
                                                                {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                                                            </div>
                                                            <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                                                                {c.content || ""}
                                                            </p>

                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* add comment */}
                                            <div className="mt-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        Add a comment
                                                    </label>
                                                    {commentPostError && (
                                                        <span className="text-sm text-red-500">{commentPostError}</span>
                                                    )}
                                                </div>

                                                <div className="mt-2">
                                                      <textarea
                                                          value={commentText}
                                                          onChange={(e) => setCommentText(e.target.value)}
                                                          rows={4}
                                                          placeholder="Write a comment…"
                                                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-purple-300"/>
                                                </div>

                                                <div className="mt-3 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={handleAddCommentInline}
                                                        className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                                                    >
                                                        Post Comment
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-200">
                                            <MessageSquare className="w-5 h-5" />
                                            <span className="text-sm">{activeRequest.commentCount || 0}</span>
                                        </div>

                                        <div className={!sameUser(activeRequest.user_id, currentUser?.id) ? "hidden" : ""}>
                                            <CardDropdown
                                                onEdit={() => openEditRte(activeRequest)}
                                                onDelete={() => openDeleteModal(activeRequest)}
                                            />
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </motion.div>
                        </div>
                    </Dialog>
                )}
            </AnimatePresence>

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
