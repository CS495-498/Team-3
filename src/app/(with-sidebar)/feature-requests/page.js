"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import DOMPurify from "isomorphic-dompurify";
import {
    ChevronsUp,
    MessageSquare,
    Paperclip,
    FileText,
    File,
    Film,
} from "lucide-react";
import SuccessToast from "@/components/ui/success-toast.jsx";
import LoadingIndicator from "@/components/ui/loading-indicator.jsx";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { useServerInfiniteScroll } from "@/hooks/use-server-infinite-scroll";

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
import {getUpvoteList} from "@/lib/featureRequests/votes/getUpvoteList.js";
import {TooltipContent, TooltipProvider, TooltipTrigger} from "@radix-ui/react-tooltip";
import {Tooltip} from "recharts";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";

export default function Home() {
    const [currentUser, setCurrentUser] = useState(null);

    const [deleteToast, setDeleteToast] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const [statusFilter, setStatusFilter] = useState("all");
    const [sortOption, setSortOption] = useState("votes_desc");
    const [userFilter, setUserFilter] = useState("");
    const [debouncedUserFilter, setDebouncedUserFilter] = useState("");

    // Show completed toggle (persisted in sessionStorage)
    const [showCompleted, setShowCompleted] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = sessionStorage.getItem("featureRequests_showCompleted");
            return saved === "true";
        }
        return false;
    });

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [activeVideoSrc, setActiveVideoSrc] = useState(null);

    // Optimistic vote overrides
    const [voteOverrides, setVoteOverrides] = useState({});

    // Full request viewer
    const { user, loading: userLoading } = useUser();

    const canManageAll =
        !!user && hasPermission(user.role, PERMISSIONS.MANAGE_ALL_FEATURE_REQUESTS);

    const canManageAllComments =
        !!user && hasPermission(user.role, PERMISSIONS.MANAGE_ALL_COMMENTS);

    const canPublish =
        !!user && hasPermission(user.role, PERMISSIONS.PUBLISH_FEATURE_REQUESTS);

    const canEditRequest = (request) => {
        if (!user) return false;
        if (canManageAll) return true;
        return canPublish && request.user_id === user.id;
    };

    // "open feature request to see whole thing"
    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [activeRequest, setActiveRequest] = useState(null);

    // Comments (plain text)
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [commentPostError, setCommentPostError] = useState("");
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentText, setEditingCommentText] = useState("");
    const [deleteCommentId, setDeleteCommentId] = useState(null);

    // Upvoter List
    const [upvoteList, setUpvoteList] = useState(null);


    // Add/Edit RTE modal
    const [rteModalOpen, setRteModalOpen] = useState(false);
    const [rteMode, setRteMode] = useState("add"); // "add" | "edit"
    const [rteTitle, setRteTitle] = useState("");
    const [rteError, setRteError] = useState("");
    const [dialogEditorContent, setDialogEditorContent] = useState("");
    const editorRef = useRef(null);
    const hasLoadedOnce = useRef(false);

    // File attachment when adding/editing
    const [rteFile, setRteFile] = useState(null);
    const [rteFilePreviewUrl, setRteFilePreviewUrl] = useState(null);

    // Debounce user filter (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedUserFilter(userFilter);
        }, 300);
        return () => clearTimeout(timer);
    }, [userFilter]);

    useEffect(() => {
        let mounted = true;
        fetch("/api/profiles/me")
            .then((r) => r.json())
            .then((data) => {
                if (!mounted) return;
                if (!data || data?.error) setCurrentUser(null);
                else setCurrentUser(data);
            })
            .catch((err) => {
                console.error("Failed to load current user:", err);
                setCurrentUser(null);
            });

        return () => {
            mounted = false;
        };
    }, []);

    // Persist showCompleted preference to sessionStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem(
                "featureRequests_showCompleted",
                showCompleted.toString()
            );
        }
    }, [showCompleted]);

    // cleanup blob URL to avoid memory leaks
    useEffect(() => {
        if (!rteModalOpen && rteFilePreviewUrl) {
            URL.revokeObjectURL(rteFilePreviewUrl);
            setRteFilePreviewUrl(null);
        }
    }, [rteModalOpen, rteFilePreviewUrl]);

    // Clear vote overrides when filters/sort change
    useEffect(() => {
        setVoteOverrides({});
    }, [statusFilter, showCompleted, sortOption, debouncedUserFilter]);

    // Server-side paginated fetch
    const fetchFeatureRequests = useCallback(
        async (page, limit) => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (statusFilter !== "all") params.set("status", statusFilter);
            params.set("showCompleted", showCompleted.toString());
            params.set("sort", sortOption);
            if (debouncedUserFilter) params.set("user", debouncedUserFilter);

            const response = await fetch(`/api/feature-requests?${params.toString()}`);
            if (!response.ok) {
                throw new Error("Failed to fetch feature requests");
            }
            return response.json();
        },
        [statusFilter, showCompleted, sortOption, debouncedUserFilter]
    );

    const {
        items: visibleRequests,
        isLoading,
        isInitialLoad,
        hasMore,
        total,
        error,
        ref: sentinelRef,
        refresh,
        updateItem,
        removeItem,
    } = useServerInfiniteScroll({
        fetchFn: fetchFeatureRequests,
        limit: 6,
        dependencies: [statusFilter, showCompleted, sortOption, debouncedUserFilter],
        itemsKey: "featureRequests",
    });

    // Track whether the very first load has completed
    useEffect(() => {
        if (!isInitialLoad && !userLoading) {
            hasLoadedOnce.current = true;
        }
    }, [isInitialLoad, userLoading]);

    // Derive votes from items + overrides
    const votes = useMemo(() => {
        const map = {};
        visibleRequests.forEach((req) => {
            const override = voteOverrides[req.id];
            if (override !== undefined) {
                map[req.id] = override.vote;
            } else if (req.currentUserVote) {
                map[req.id] = req.currentUserVote;
            }
        });
        return map;
    }, [visibleRequests, voteOverrides]);

    const getEffectiveVoteCount = (req) => {
        return req.number_of_votes + (voteOverrides[req.id]?.voteDelta || 0);
    };

    const sameUser = (feature_request_user_id, user_id) =>
        user_id === feature_request_user_id;

    const isCommentOwner = (commentUserId) => {
        if (!user) return false;
        return user.id === commentUserId;
    };

    const isImage = (url) => {
        if (!url) return false;
        const path = url.split("?")[0];
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
    };

    // strict sanitization (no embeds)
    const sanitizeHTML = (html) => DOMPurify.sanitize(html || "");

    /**
     * IMPORTANT: This component NEVER renders a button.
     * It only renders a visual preview (image/pdf icon/video thumb/generic icon).
     * The "Open attachment" button is rendered once by the parent.
     */
    function AttachmentPreview({ url, size = 80, fileName = "" }) {
        if (!url) return null;

        const frameClass =
            "rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden";

        // Local blob URLs won't have extensions; use the chosen file's mime/name for nicer preview if available
        const mime = rteFile?.type || "";
        const name = fileName || rteFile?.name || "";

        const showImage =
            isImage(url) ||
            mime.startsWith("image/") ||
            /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
        const showVideo =
            isVideo(url) ||
            mime.startsWith("video/") ||
            /\.(mp4|webm|ogg)$/i.test(name);
        const showPDF = isPDF(url) || mime === "application/pdf" || /\.pdf$/i.test(name);

        if (showImage) {
            return (
                <div className={frameClass} style={{ width: size, height: size }}>
                    <img
                        src={url}
                        alt="Attachment preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                </div>
            );
        }

        if (showVideo) {
            return (
                <div className="relative" style={{ width: size, height: size }}>
                    <video
                        src={url}
                        className={frameClass}
                        style={{ width: size, height: size, objectFit: "cover" }}
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                        }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                        <Film className="w-6 h-6" />
                    </div>
                </div>
            );
        }

        if (showPDF) {
            return (
                <div className={frameClass} style={{ width: size, height: size }}>
                    <FileText className="w-8 h-8 text-gray-600 dark:text-gray-200" />
                </div>
            );
        }

        return (
            <div className={frameClass} style={{ width: size, height: size }}>
                <File className="w-8 h-8 text-gray-600 dark:text-gray-200" />
            </div>
        );
    }

    const openDeleteModal = (req) => {
        setSelectedItem(req);
        setIsDeleteOpen(true);
    };

    const handleEditComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditingCommentText(comment.content);
    };

    const cancelEditComment = () => {
        setEditingCommentId(null);
        setEditingCommentText("");
    };

    const saveEditComment = async (commentId) => {
        const text = editingCommentText.trim();
        if (!text) return;

        try {
            const res = await fetch(`/api/feature-requests/comments/${commentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: text }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setComments((prev) =>
                prev.map((c) =>
                    c.id === commentId ? { ...c, content: text } : c
                )
            );

            setEditingCommentId(null);
            setEditingCommentText("");
        } catch (err) {
            console.error("Failed to edit comment:", err);
        }
    };

    const openDeleteCommentModal = async (comment) => {
        if (!confirm("Delete this comment?")) return;

        try {
            const res = await fetch(`/api/feature-requests/comments/${comment.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Delete failed");

            setComments((prev) => prev.filter((c) => c.id !== comment.id));

            updateItem(activeRequest.id, (prev) => ({
                ...prev,
                commentCount: (prev.commentCount || 1) - 1,
            }));

            setActiveRequest((prev) =>
                prev ? { ...prev, commentCount: (prev.commentCount || 1) - 1 } : prev
            );
        } catch (err) {
            console.error("Delete comment failed:", err);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedItem) return;

        try {
            const res = await fetch(`/api/feature-requests/${selectedItem.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error("Failed to delete feature request:", err.error || err);
                return;
            }

            removeItem(selectedItem.id);

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

    const handleVote = async (id, upvoted) => {
        const currentVote = voteOverrides[id]?.vote ??
            visibleRequests.find((r) => r.id === id)?.currentUserVote ?? null;

        const newVote = currentVote === upvoted ? null : upvoted;

        let delta;
        if (currentVote === upvoted) delta = upvoted === "up" ? -1 : +1;
        else if (currentVote) delta = upvoted === "up" ? +2 : -2;
        else delta = upvoted === "up" ? +1 : -1;

        const existingDelta = voteOverrides[id]?.voteDelta || 0;

        setVoteOverrides((prev) => ({
            ...prev,
            [id]: { vote: newVote, voteDelta: existingDelta + delta },
        }));

        const apiVote = currentVote === upvoted ? "remove" : upvoted;

        try {
            await castVote(id, apiVote);
        } catch (err) {
            console.error("Vote failed:", err);
            // Revert on failure
            setVoteOverrides((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
        }
    };

    const getUpvoteData = async (id) => {
        setUpvoteList(null)
        try {
            const data = await getUpvoteList(id);
            setUpvoteList(data || [])
        } catch (error) {
            console.error("Failed to retrieve upvote list:", error);
            setUpvoteList([])
        }
    }

    // open full request + load comments
    const openRequest = async (req) => {
        setActiveRequest(req);
        setIsRequestOpen(true);

        setCommentText("");
        setCommentPostError("");

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

    const openAddRte = () => {
        setRteError("");
        setRteMode("add");
        setSelectedItem(null);
        setRteTitle("");
        setDialogEditorContent("");
        setRteFile(null);
        if (rteFilePreviewUrl) URL.revokeObjectURL(rteFilePreviewUrl);
        setRteFilePreviewUrl(null);
        setRteModalOpen(true);
    };

    const openEditRte = (req) => {
        setRteError("");
        setRteMode("edit");
        setSelectedItem(req);
        setRteTitle(req?.title || "");
        setDialogEditorContent(req?.content || "");
        setRteFile(null);
        if (rteFilePreviewUrl) URL.revokeObjectURL(rteFilePreviewUrl);
        setRteFilePreviewUrl(null);
        setRteModalOpen(true);
    };

    // Save feature request WITH optional file attachment
    const handleRteSave = async () => {
        setRteError("");

        const html = editorRef.current?.getHTML?.() ?? "";
        const title = (rteTitle || "").trim();

        if (!title) {
            setRteError("Title is required.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("content", html);
            if (rteFile) formData.append("file", rteFile);

            if (rteMode === "add") {
                const res = await fetch("/api/feature-requests", {
                    method: "POST",
                    body: formData,
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok) {
                    throw new Error(data.error || "Failed to add feature request");
                }

                setRteModalOpen(false);
                refresh();

                setShowToast(true);
                setTimeout(() => setShowToast(false), 2000);
                return;
            }

            // edit
            if (rteMode === "edit") {
                if (!selectedItem || !currentUser) return;
                if (!sameUser(selectedItem.user_id, currentUser.id) && !canManageAll) return;

                const html = editorRef.current?.getHTML?.() ?? "";
                const payload = {
                    title: (rteTitle || "").trim(),
                    content: html,
                };

                const res = await fetch(`/api/feature-requests/${selectedItem.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok) {
                    throw new Error(data.error || "Failed to update feature request");
                }

                updateItem(data.id, (prev) => ({
                    ...prev,
                    ...data,
                    username: data.username ?? prev.username,
                    commentCount: data.commentCount ?? prev.commentCount,
                    number_of_votes: prev.number_of_votes,
                    currentUserVote: prev.currentUserVote,
                    signed_file_url: prev.signed_file_url,
                }));

                setActiveRequest((prev) =>
                    prev?.id === data.id
                        ? {
                            ...prev,
                            ...data,
                            username: data.username ?? prev.username,
                            commentCount: data.commentCount ?? prev.commentCount,
                        }
                        : prev
                );

                setRteModalOpen(false);
            }
        } catch (e) {
            console.error(e);
            setRteError(e?.message || "Failed to save. Check console for details.");
        }
    };

    const handleAddCommentInline = async () => {
        if (!activeRequest?.id) return;

        setCommentPostError("");
        const text = (commentText || "").trim();

        if (!text) {
            setCommentPostError("Comment cannot be empty.");
            return;
        }

        try {
            const newComment = await addComment(activeRequest.id, text);

            setComments((prev) => [...prev, newComment]);

            updateItem(activeRequest.id, (prev) => ({
                ...prev,
                commentCount: (prev.commentCount || 0) + 1,
            }));

            setActiveRequest((prev) =>
                prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev
            );

            setCommentText("");
        } catch (e) {
            console.error("Failed to post comment:", e);
            setCommentPostError("Failed to post comment. Please try again.");
        }
    };

    if (!hasLoadedOnce.current && (isInitialLoad || userLoading)) {
        return <LoadingIndicator label="Loading feature requests..." />;
    }

    return (
        <main className="pt-4 px-10 min-h-screen w-full">
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

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 mb-6 mt-6 items-center">
                <h1 className="text-3xl font-bold mr-2">Feature Requests</h1>
                <div className="mb-6 mt-6 bg-secondary/40 p-4 rounded-lg">
                    <div className="flex flex-wrap items-center gap-6.5">

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort */}
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

                        {/* User Search */}
                        <input
                            type="text"
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            placeholder="Search by user..."
                            className="h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />

                        {/* Show Completed Toggle */}
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="show-completed"
                                className="text-sm text-muted-foreground cursor-pointer"
                            >
                                Show completed
                            </label>
                            <Switch
                                id="show-completed"
                                checked={showCompleted}
                                onCheckedChange={setShowCompleted}
                            />
                        </div>

                        {/* Add Button - pushed to the right */}
                        {canPublish && (
                            <button
                                onClick={openAddRte}
                                type="button"
                                className="ml-auto text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                            >
                                Add Feature Request
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isInitialLoad ? (
                <div className="flex justify-center items-center py-16">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Loading feature requests...</span>
                    </div>
                </div>
            ) : error ? (
                <div className="p-6 text-center text-red-500">
                    Error: {error}
                </div>
            ) : visibleRequests.length === 0 ? (
                <p className="text-gray-600 ml-4">
                    No results found for the selected filters.
                </p>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {visibleRequests.map((req) => {
                        const voteState = votes[req.id];

                        const previewText = (req.content || "")
                            .replace(/<[^>]*>/g, " ")
                            .replace(/\s+/g, " ")
                            .trim();

                        const isCompleted = req.status === "completed";

                        return (
                            <li
                                key={req.id}
                                className={`flex items-center py-4 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 ${isCompleted ? "opacity-60 dark:opacity-50" : ""
                                    }`}
                            >
                                <div className="flex flex-col items-center space-y-2 mr-4">
                                    <button
                                        type="button"
                                        className={`p-1 rounded-md transition ${voteState === "up"
                                            ? "text-green-600"
                                            : "text-gray-700 dark:text-gray-50 hover:bg-gray-200 dark:hover:bg-gray-800"
                                        }`}
                                        onClick={() => handleVote(req.id, "up")}
                                    >
                                        <ChevronsUp className="w-5 h-5 hover:bg-gray-200 dark:hover:bg-gray-800"/>
                                    </button>
                                    <DropdownMenu onOpenChange={(open) => {
                                        if(open) getUpvoteData(req.id)
                                    }}>
                                        <DropdownMenuTrigger >
                                            {getEffectiveVoteCount(req)}
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent >
                                            {upvoteList === null ? (
                                                <span className="px-2 py-1 text-sm">Loading...</span>
                                            ) : (upvoteList.length === 0 ? (
                                                <span className="cursor-pointer"> No Upvotes</span>
                                            ) : (
                                                (upvoteList.map((vote) => (
                                                    <DropdownMenuItem key={vote.id}>
                                                        {vote.username}
                                                    </DropdownMenuItem>
                                                    ))
                                                )
                                            ))
                                            }
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex-shrink-0 flex items-center justify-center mr-4">
                                    <button
                                        type="button"
                                        onClick={() => openRequest(req)}
                                        aria-label={
                                            req.signed_file_url ? "Open attachment" : "Open request"
                                        }
                                        className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                                    >
                                        {req.signed_file_url ? (
                                            <AttachmentPreview url={req.signed_file_url} size={64} />
                                        ) : (
                                            <div
                                                className="w-16 h-16 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                                title="No attachment"
                                            >
                                                <MessageSquare className="w-10 h-10 text-gray-600 dark:text-gray-300" />
                                            </div>
                                        )}
                                    </button>
                                </div>

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
                                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${req.status === "open"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : req.status === "in_progress"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : req.status === "completed"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-200 text-gray-700"
                                                    }`}
                                            >
                                                {String(req.status).replace("_", " ")}
                                            </span>
                                        )}

                                        <span className="text-sm text-gray-500">— {req.username}</span>
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={() => openRequest(req)}
                                        className="text-left"
                                        title="Open feature request"
                                    >
                                        {/* 3 lines + wraps long unbroken strings */}
                                        <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-3 [overflow-wrap:anywhere]">
                                            {previewText || "No description"}
                                        </p>
                                    </button>

                                    <p className="text-xs text-gray-400 mt-1">
                                        Created: {new Date(req.created_at).toLocaleString()}
                                    </p>
                                </div>

                                <div className="flex justify-between items-center ml-4 gap-2">
                                    <div
                                        className={!sameUser(req.user_id, currentUser?.id) ? "hidden" : ""}
                                    >
                                        {canEditRequest(req) && (
                                            <CardDropdown
                                                onEdit={() => openEditRte(req)}
                                                onDelete={() => openDeleteModal(req)}
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-200">
                                        <button
                                            type="button"
                                            className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-800"
                                            onClick={() => openRequest(req)}
                                        >
                                            <MessageSquare className="w-5 h-5" />
                                            <span className="text-sm px-1">{req.commentCount}</span>
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {hasMore && !isInitialLoad && (
                <div
                    ref={sentinelRef}
                    className="flex flex-col justify-center items-center py-8 mt-6"
                >
                    {isLoading && (
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Loading more requests...</span>
                        </div>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Showing {visibleRequests.length} of {total} requests
                    </p>
                </div>
            )}

            <DeleteModal
                isOpen={isDeleteOpen}
                closeModal={() => setIsDeleteOpen(false)}
                onDeleteConfirm={handleConfirmDelete}
            />

            {/* Add/Edit Modal */}
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
                                            {rteMode === "add"
                                                ? "Add Feature Request"
                                                : "Edit Feature Request"}
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

                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-200" />
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    Attachment
                                                </h4>
                                            </div>

                                            {(() => {
                                                const displayUrl =
                                                    rteFilePreviewUrl || selectedItem?.signed_file_url;
                                                const displayName =
                                                    rteFile?.name ||
                                                    (selectedItem?.file_url
                                                        ? selectedItem.file_url.split("/").pop()
                                                        : "");

                                                return displayUrl ? (
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <AttachmentPreview
                                                            url={displayUrl}
                                                            size={64}
                                                            fileName={displayName}
                                                        />

                                                        <button
                                                            type="button"
                                                            onClick={() => window.open(displayUrl, "_blank")}
                                                            className="text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                                        >
                                                            Open attachment
                                                        </button>

                                                        {displayName ? (
                                                            <span className="text-xs text-gray-500 dark:text-gray-300 truncate max-w-[40ch]">
                                                                {displayName}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 dark:text-gray-300 mb-3">
                                                        No attachment selected.
                                                    </p>
                                                );
                                            })()}

                                            <input
                                                id="rte-file"
                                                type="file"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0] || null;
                                                    setRteFile(file);

                                                    if (rteFilePreviewUrl)
                                                        URL.revokeObjectURL(rteFilePreviewUrl);

                                                    if (file)
                                                        setRteFilePreviewUrl(URL.createObjectURL(file));
                                                    else setRteFilePreviewUrl(null);
                                                }}
                                                className="hidden"
                                            />

                                            <label
                                                htmlFor="rte-file"
                                                className="text-white bg-linear-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap cursor-pointer inline-flex items-center"
                                            >
                                                Choose file
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                Content
                                            </label>
                                            <div className="w-full min-h-[300px] rounded-md p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                                                <SimpleEditor
                                                    html={dialogEditorContent}
                                                    editorRef={editorRef}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </motion.div>
                        </div>
                    </Dialog>
                )}
            </AnimatePresence>

            {/* Full Request Modal */}
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
                                                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${activeRequest.status === "open"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : activeRequest.status === "in_progress"
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : activeRequest.status === "completed"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-gray-200 text-gray-700"
                                                            }`}
                                                    >
                                                        {String(activeRequest.status).replace("_", " ")}
                                                    </span>
                                                )}
                                                <span>— {activeRequest.username}</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
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

                                        {activeRequest.signed_file_url ? (
                                            <div className="flex items-start gap-3">
                                                <AttachmentPreview
                                                    url={activeRequest.signed_file_url}
                                                    size={80}
                                                />
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                        <Paperclip className="w-4 h-4" />
                                                        Attachment
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            window.open(activeRequest.signed_file_url, "_blank")
                                                        }
                                                        className="w-fit text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                                    >
                                                        Open attachment
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}

                                        {/* Comments */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    Comments ({activeRequest.commentCount || 0})
                                                </h4>

                                                <span className="text-xs text-gray-400">
                                                    Created:{" "}
                                                    {new Date(activeRequest.created_at).toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="mt-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        Add a comment
                                                    </label>
                                                    {commentPostError && (
                                                        <span className="text-sm text-red-500">
                                                            {commentPostError}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-2">
                                                    <textarea
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        rows={4}
                                                        placeholder="Write a comment…"
                                                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-purple-300"
                                                    />
                                                </div>

                                                <div className="mt-3 flex justify-end py-4">
                                                    <button
                                                        type="button"
                                                        onClick={handleAddCommentInline}
                                                        className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                                                    >
                                                        Post Comment
                                                    </button>
                                                </div>
                                            </div>

                                            {commentsLoading ? (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Loading comments...
                                                </p>
                                            ) : comments.length === 0 ? (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    No comments yet.
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {comments.map((c) => {
                                                        const displayName =
                                                            c.username || c.user?.username || c.user_id || "User";

                                                        const canModifyComment =
                                                            isCommentOwner(c.user_id) || canManageAllComments;

                                                        return (
                                                            <div
                                                                key={c.id}
                                                                className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800"
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                                        {displayName} •{" "}
                                                                        {c.created_at
                                                                            ? new Date(c.created_at).toLocaleString()
                                                                            : ""}
                                                                        {c.updated_at && c.updated_at !== c.created_at && (
                                                                            <span className="ml-1 text-[10px] text-gray-400">(edited)</span>
                                                                        )}
                                                                    </div>

                                                                    {canModifyComment && (
                                                                        <CardDropdown
                                                                            onEdit={() => handleEditComment(c)}
                                                                            onDelete={() => openDeleteCommentModal(c)}
                                                                        />
                                                                    )}
                                                                </div>

                                                                {editingCommentId === c.id ? (
                                                                    <div className="mt-2 space-y-2">
                                                                        <textarea
                                                                            value={editingCommentText}
                                                                            onChange={(e) => setEditingCommentText(e.target.value)}
                                                                            rows={3}
                                                                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                                                                        />

                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => saveEditComment(c.id)}
                                                                                className="text-xs px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
                                                                            >
                                                                                Save
                                                                            </button>

                                                                            <button
                                                                                onClick={cancelEditComment}
                                                                                className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                                                                        {c.content || ""}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-200">
                                            <MessageSquare className="w-5 h-5" />
                                            <span className="text-sm">
                                                {activeRequest.commentCount || 0}
                                            </span>
                                        </div>

                                        <div
                                            className={
                                                !sameUser(activeRequest.user_id, currentUser?.id)
                                                    ? "hidden"
                                                    : ""
                                            }
                                        >
                                            {canEditRequest(activeRequest) && (
                                                <CardDropdown
                                                    onEdit={() => openEditRte(activeRequest)}
                                                    onDelete={() => openDeleteModal(activeRequest)}
                                                />
                                            )}
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
                                <button
                                    type="button"
                                    className="absolute top-4 right-4 text-white text-2xl z-10"
                                    onClick={() => setVideoModalOpen(false)}
                                    title="Close video"
                                >
                                    ×
                                </button>

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
