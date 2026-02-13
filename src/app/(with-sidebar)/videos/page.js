"use client";

import postAsset from "@/app/api/helper/postAsset";
import appendVideo from "@/app/api/helper/appendVideo";
import {
    extractThumbnailFromVideo,
    getYouTubeThumbnail,
    getVimeoThumbnail,
    downloadImageAsFile,
    getVideoEmbed
} from "../../api/helper/videoThumbnailUtils";

import React, { useState, useEffect, Fragment, useMemo } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { AnimatePresence, motion } from "framer-motion";
import SuccessToast from "@/components/ui/success-toast.jsx";
import LoadingIndicator from "@/components/ui/loading-indicator.jsx";

import BookmarkButton from "@/components/bookmark-button";
import { BOOKMARK_TYPES, useBookmarks } from "@/hooks/use-bookmarks";

import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Dialog } from "@headlessui/react";
import EditVideoLibraryModal from "@/components/editVideoLibraryModal.jsx";
import DeleteModal from "@/components/deleteModal.jsx";
import CardDropdown from "@/components/cardDropdown.jsx";

import { X } from "lucide-react";

import { useUser } from "@/context/UserContext";
import { hasPermission } from "@/utils/hasPermission";
import PERMISSIONS from "@/config/permissions";

/* ---------------------------------------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------------------------------------- */
export default function VideoLibrary() {
    const [entry, setEntry] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [playingIndex, setPlayingIndex] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [selectedItem, setSelectedItem] = useState(null);

    // New state for thumbnail generation
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [generatedThumbnail, setGeneratedThumbnail] = useState(null);
    const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openEditModal = (demo) => {
        setSelectedItem(demo);
        setIsEditOpen(true);
    };

    const openDeleteModal = (demo) => {
        setSelectedItem(demo);
        setIsDeleteOpen(true);
    };

    const { isBookmarked, toggleBookmark, isPending } = useBookmarks(
        BOOKMARK_TYPES.VIDEO
    );

    const getVideoId = (video) =>
        video?.uid ||
        video?.system?.uid ||
        video?.video_file?.uid ||
        video?.se_name ||
        video?.title;



    const { user, loading: userLoading } = useUser();
    const canUploadVideo = hasPermission(user.role, "upload_video_library");

    /* -----------------------------------------------------------------------------------
        BOOKMARK HANDLER
    ----------------------------------------------------------------------------------- */
    const handleBookmarkToggle = async (video) => {
        const resourceId = getVideoId(video);
        if (!resourceId) {
            alert("Unable to bookmark this video because it is missing an identifier.");
            return;
        }

        const result = await toggleBookmark(resourceId, {
            title: video?.title,
            description: video?.description,
            url: video?.video_url || video?.video_file?.url,
            thumbnail: video?.thumbnail?.url,
            extra: {
                type: "video",
                se_name: video?.se_name,
            },
        });

        if (result?.error === "AUTH_REQUIRED") {
            alert("Please sign in to bookmark videos.");
        } else if (result?.error) {
            alert("Could not update bookmark. Please try again.");
        }
    };

    /* -----------------------------------------------------------------------------------
        LOAD CONTENTSTACK ENTRY
    ----------------------------------------------------------------------------------- */
    const getContent = async () => {
        try {
            const entry = await Stack.getElementByTypeWithRefs(
                "video_library",
                "en-us",
                ["videos"]
            );

            setEntry(entry[0][0]);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching video library content:", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        onEntryChange(getContent);
    }, []);

    /* -----------------------------------------------------------------------------------
        VIDEO FILTERING
    ----------------------------------------------------------------------------------- */
    const videos =
        entry?.videos?.filter((video) => {
            const query = searchQuery.toLowerCase();
            return (
                video.title?.toLowerCase().includes(query) ||
                video.se_name?.toLowerCase().includes(query) ||
                video.description?.toLowerCase().includes(query)
            );
        }) || [];

    const sortedVideos = useMemo(() => {
        if (!videos.length) return [];
        return [...videos].sort((a, b) => {
            const aBookmarked = isBookmarked(getVideoId(a));
            const bBookmarked = isBookmarked(getVideoId(b));
            if (aBookmarked === bBookmarked) return 0;
            return aBookmarked ? -1 : 1;
        });
    }, [videos, isBookmarked]);

    const { items: visibleVideos, hasMore, ref } = useInfiniteScroll(sortedVideos, 6);

    /* -----------------------------------------------------------------------------------
        THUMBNAIL GENERATION HANDLERS
    ----------------------------------------------------------------------------------- */

    /**
     * Handle video file selection and auto-generate thumbnail
     */
    const handleVideoFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            setThumbnailPreview(null);
            setGeneratedThumbnail(null);
            return;
        }

        setIsGeneratingThumbnail(true);
        try {
            const thumbnailFile = await extractThumbnailFromVideo(file);
            setGeneratedThumbnail(thumbnailFile);

            // Create preview URL
            const previewUrl = URL.createObjectURL(thumbnailFile);
            setThumbnailPreview(previewUrl);
        } catch (error) {
            console.error('Failed to generate thumbnail from video:', error);
            // Don't alert - just fail silently and let user upload manually if needed
        } finally {
            setIsGeneratingThumbnail(false);
        }
    };

    /**
     * Handle video URL input and auto-fetch thumbnail
     */
    const handleVideoUrlChange = async (e) => {
        const url = e.target.value.trim();
        if (!url) {
            setThumbnailPreview(null);
            setGeneratedThumbnail(null);
            return;
        }

        setIsGeneratingThumbnail(true);
        try {
            let thumbnailUrl = null;

            // Try YouTube
            thumbnailUrl = getYouTubeThumbnail(url);

            // Try Vimeo if not YouTube
            if (!thumbnailUrl) {
                thumbnailUrl = await getVimeoThumbnail(url);
            }

            if (thumbnailUrl) {
                // Download the thumbnail as a File object
                const thumbnailFile = await downloadImageAsFile(
                    thumbnailUrl,
                    'video_thumbnail.jpg'
                );
                setGeneratedThumbnail(thumbnailFile);
                setThumbnailPreview(thumbnailUrl);
            } else {
                setThumbnailPreview(null);
                setGeneratedThumbnail(null);
            }
        } catch (error) {
            console.error('Failed to fetch thumbnail from URL:', error);
            setThumbnailPreview(null);
            setGeneratedThumbnail(null);
        } finally {
            setIsGeneratingThumbnail(false);
        }
    };

    /**
     * Handle manual thumbnail upload (overrides auto-generated)
     */
    const handleManualThumbnailChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // User provided manual thumbnail - use it instead
            setGeneratedThumbnail(null);
            const previewUrl = URL.createObjectURL(file);
            setThumbnailPreview(previewUrl);
        }
    };

    /**
     * Reset thumbnail state when modal closes
     */
    const resetThumbnailState = () => {
        if (thumbnailPreview) {
            URL.revokeObjectURL(thumbnailPreview);
        }
        setThumbnailPreview(null);
        setGeneratedThumbnail(null);
        setIsGeneratingThumbnail(false);
    };

    /* -----------------------------------------------------------------------------------
        FORM SUBMIT (FILE OR URL)
    ----------------------------------------------------------------------------------- */
    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData(e.target);

        const title = data.get("title");
        const description = data.get("description");
        const se_name = data.get("se_name");
        const date_posted = data.get("date_posted");

        const videoFile = data.get("video_file");
        const videoURL = data.get("video_url")?.trim();
        const manualThumbnailFile = data.get("thumbnail");

        const titleProvided = title?.trim().length > 0;
        const urlProvided = videoURL && videoURL.length > 0;
        const fileProvided = videoFile && videoFile.size > 0;

        // VALIDATION: title & (file XOR URL)
        if (!titleProvided || (!fileProvided && !urlProvided) || (fileProvided && urlProvided)) {
            alert("Please provide a title and either a video file OR a video URL.");
            return;
        }

        try {
            setIsSubmitting(true); // START LOADING
            // Upload file if present
            const uploadedVideo = fileProvided
                ? await postAsset(
                    videoFile,
                    title,
                    description,
                    null,
                    "video-library"
                )
                : null;

            // Determine which thumbnail to use:
            // 1. Manual upload (if provided)
            // 2. Auto-generated (if available)
            // 3. None
            let thumbnailToUpload = null;
            if (manualThumbnailFile && manualThumbnailFile.size > 0) {
                thumbnailToUpload = manualThumbnailFile;
            } else if (generatedThumbnail) {
                thumbnailToUpload = generatedThumbnail;
            }

            const uploadedThumb = thumbnailToUpload
                ? await postAsset(
                    thumbnailToUpload,
                    `${title} Thumbnail`,
                    "Video thumbnail",
                    null,
                    "video-thumbnails"
                )
                : null;

            // Build video object
            const newVideo = {
                video_file: uploadedVideo?.asset?.uid || null,
                video_url: urlProvided ? videoURL : null,
                thumbnail: uploadedThumb?.asset?.uid || null,
                title,
                description,
                se_name,
                date_posted: date_posted || new Date().toISOString(),
            };

            const updatedVideos = appendVideo(entry, newVideo);

            const response = await fetch("/api/update-video-library-in-cs", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entryUid: entry.uid,
                    videos: updatedVideos,
                }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Update failed: ${response.status} ${text}`);
            }

            const updatedEntry = await response.json();
            setEntry(updatedEntry.entry);
            setIsOpen(false);
            resetThumbnailState();
            setShowToast(true);

            setTimeout(() => {
                setShowToast(false);
            }, 2000);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to add video. Check console for details.");
        } finally {
            setIsSubmitting(false);
        }
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

    /* -----------------------------------------------------------------------------------
        RENDER
    ----------------------------------------------------------------------------------- */
    if (isLoading) {
        return <LoadingIndicator label="Loading videos..." />;
    }

    return (
        <div className="pl-10 pt-6 min-h-screen flex flex-col">
            <SuccessToast
                message="Video added!"
                isOpen={showToast}
                onClose={() => setShowToast(false)}
            />

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6 pt-6">
                <h1 className="text-4xl font-bold ml-4">{entry?.title}</h1>

                <div className="flex items-center gap-2 mr-4">
                    {canUploadVideo && (
                        <button
                            type="button"
                            onClick={() => setIsOpen(true)}
                            className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                        >
                            Add Video
                        </button>
                    )}

                    <div className="relative w-full max-w-sm dark:text-black">
                        <input
                            type="text"
                            placeholder="Search videos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 
             bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 
             px-4 py-2 pl-10 text-sm 
             focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 
             outline-none transition"
                        />

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
                            />
                        </svg>
                    </div>

                    <AnimatePresence>
                        {isOpen && (
                            <Dialog
                                className="fixed inset-0 z-50"
                                open={isOpen}
                                onClose={() => {
                                    setIsOpen(false);
                                    resetThumbnailState();
                                }}
                            >
                                <motion.div
                                    className="fixed inset-0 bg-black/50"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    aria-hidden="true"
                                />

                                <div className="fixed inset-0 flex items-center justify-center p-6">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.96, y: -8 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                        className="w-full max-w-3xl mx-auto"
                                    >
                                        <Dialog.Panel className="w-full rounded-xl bg-white dark:bg-gray-800 p-8 shadow-2xl">
                                            <div className="flex justify-between items-center mb-6">
                                                <Dialog.Title className="font-bold text-2xl">
                                                    Add Video
                                                </Dialog.Title>
                                                <button onClick={() => {
                                                    setIsOpen(false);
                                                    resetThumbnailState();
                                                }}>
                                                    <X className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                                                </button>
                                            </div>

                                            <form onSubmit={handleSubmit} className="space-y-5">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                                            Title
                                                        </label>
                                                        <input
                                                            name="title"
                                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                                            Date Posted
                                                        </label>
                                                        <input
                                                            name="date_posted"
                                                            type="date"
                                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <div>
                                                            <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                                                Video File
                                                            </label>
                                                            <input
                                                                name="video_file"
                                                                type="file"
                                                                accept="video/*"
                                                                onChange={handleVideoFileChange}
                                                                className="w-full text-sm text-gray-700 dark:text-gray-200
                          file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                          file:text-sm file:font-medium file:bg-gray-400 file:text-white
                          hover:file:bg-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                          rounded-lg px-2 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500
                          outline-none transition"/>
                                                        </div>
                                                    </div>
                                                    <div className="relative flex items-center justify-center w-12">
                                                        {/* Divider aligned with input center */}
                                                        <div className="absolute top-1/2 transform -translate-y-1/3 left-0 right-0 border-t border-gray-300 dark:border-gray-600"></div>
                                                        <span className="relative px-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                                                            or
                                                        </span>
                                                    </div>

                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                                            Video URL
                                                        </label>
                                                        <input
                                                            name="video_url"
                                                            type="url"
                                                            placeholder="https://youtube.com/watch?v=VIDEO"
                                                            onChange={handleVideoUrlChange}
                                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                        />
                                                    </div>
                                                </div>


                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                                            SE Name
                                                        </label>
                                                        <input
                                                            name="se_name"
                                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                                            Description
                                                        </label>
                                                        <textarea
                                                            name="description"
                                                            rows={3}
                                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                                                        />
                                                    </div>

                                                    {/* Thumbnail Section with Preview */}
                                                    <div>
                                                        <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                                            Thumbnail {isGeneratingThumbnail && <span className="text-xs text-gray-500">(Generating...)</span>}
                                                        </label>

                                                        {/* Thumbnail Preview */}
                                                        {thumbnailPreview && (
                                                            <div className="mb-3 relative inline-block">
                                                                <img
                                                                    src={thumbnailPreview}
                                                                    alt="Thumbnail preview"
                                                                    className="h-32 rounded-lg border-2 border-green-500 object-cover"
                                                                />
                                                                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                                                    ✓ Auto-generated
                                                                </div>
                                                            </div>
                                                        )}

                                                        <input
                                                            name="thumbnail"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleManualThumbnailChange}
                                                            className="w-full text-sm text-gray-700 dark:text-gray-200
                          file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                          file:text-sm file:font-medium file:bg-gray-400 file:text-white
                          hover:file:bg-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                          rounded-lg px-2 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500
                          outline-none transition"
                                                        />
                                                        <small className="text-gray-600">
                                                            {generatedThumbnail
                                                                ? "Thumbnail auto-generated. Upload a file to override."
                                                                : "Upload manually or leave blank to auto-generate from video."}
                                                        </small>
                                                    </div>
                                                </div>

                                                {/* Footer Buttons */}
                                                <div className="flex justify-end gap-3 pt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsOpen(false);
                                                            resetThumbnailState();
                                                        }}
                                                        className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                        disabled={isSubmitting}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={isGeneratingThumbnail || isSubmitting}
                                                        className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                <span>Uploading...</span>
                                                            </>
                                                        ) : isGeneratingThumbnail ? (
                                                            "Generating..."
                                                        ) : (
                                                            "Save Video"
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        </Dialog.Panel>
                                    </motion.div>
                                </div>
                            </Dialog>
                        )}
                    </AnimatePresence>

                </div>
            </div>

            {/* VIDEO GRID */}
            <div className="flex-1">
                {visibleVideos.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 me-10">
                            {visibleVideos.map((video, index) => {
                                const videoId = getVideoId(video);
                                const key = videoId ? `${videoId}-${index}` : `video-${index}`;

                                return (
                                    <div key={key} className="relative">
                                        <Card className="h-[350px] flex flex-col shadow-md hover:shadow-lg transition-all">

                                            {/* ------------------ SMART VIDEO PLAYER ------------------ */}
                                            <div className="relative w-full h-[230px] bg-black rounded-t-lg overflow-hidden">

                                                {(() => {
                                                    const media = getVideoEmbed(video);

                                                    // Playing state → show embedded video
                                                    if (playingIndex === index) {
                                                        return (
                                                            <>
                                                                {/* YouTube */}
                                                                {media?.type === "youtube" && (
                                                                    <iframe
                                                                        className="w-full h-full"
                                                                        src={media.embedUrl}
                                                                        title="YouTube video"
                                                                        frameBorder="0"
                                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                        allowFullScreen
                                                                    ></iframe>
                                                                )}

                                                                {/* Vimeo */}
                                                                {media?.type === "vimeo" && (
                                                                    <iframe
                                                                        className="w-full h-full"
                                                                        src={media.embedUrl}
                                                                        title="Vimeo video"
                                                                        frameBorder="0"
                                                                        allow="autoplay; fullscreen; picture-in-picture"
                                                                        allowFullScreen
                                                                    ></iframe>
                                                                )}

                                                                {/* Direct video file */}
                                                                {media?.type === "file" && (
                                                                    <video
                                                                        className="w-full h-full object-cover"
                                                                        controls
                                                                        autoPlay
                                                                        poster={video?.thumbnail?.url || ""}
                                                                    >
                                                                        <source src={media.embedUrl} type="video/mp4" />
                                                                    </video>
                                                                )}
                                                            </>
                                                        );
                                                    }

                                                    // Thumbnail preview mode
                                                    return (
                                                        <>
                                                            <img
                                                                src={video?.thumbnail?.url}
                                                                alt={video?.title || "Video thumbnail"}
                                                                className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                                                                onClick={() => setPlayingIndex(index)}
                                                            />

                                                            <div
                                                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 cursor-pointer"
                                                                onClick={() => setPlayingIndex(index)}
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="white"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="white"
                                                                    className="w-14 h-14"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M8.25 4.5v15l11.25-7.5L8.25 4.5z"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </>
                                                    );
                                                })()}

                                            </div>

                                            {/* ------------------ TEXT CONTENT ------------------ */}
                                            <CardHeader className="flex-grow pb-2">
                                                <div className="flex justify-between items-start mb-2">
                                                    <CardTitle className="text-lg font-semibold leading-tight line-clamp-1">
                                                        {video.title}
                                                    </CardTitle>
                                                    {canUploadVideo && (
                                                        <CardDropdown
                                                            onEdit={() => openEditModal(video)}
                                                            onDelete={() => openDeleteModal(video)}
                                                        />
                                                    )}

                                                </div>
                                                {video.description && (
                                                    <CardDescription className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                                        {video.description}
                                                    </CardDescription>
                                                )}
                                            </CardHeader>

                                            <CardFooter className="pt-0">
                                                {video.date_posted && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Posted on{" "}
                                                        {new Date(video.date_posted).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </CardFooter>
                                        </Card>


                                        {/* BOOKMARK BUTTON */}
                                        <BookmarkButton
                                            active={videoId ? isBookmarked(videoId) : false}
                                            disabled={!videoId || isPending(videoId)}
                                            onToggle={() => handleBookmarkToggle(video)}
                                            className="absolute top-3 right-3"
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {hasMore && (
                            <div
                                ref={ref}
                                className="flex flex-col justify-center items-center py-8 mt-6"
                            >
                                <div className="flex items-center gap-2 text-gray-500">
                                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm">Loading more videos...</span>
                                </div>

                                <p className="text-xs text-gray-400 mt-2">
                                    Showing {visibleVideos.length} of {videos.length} videos
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center py-12 mt-6">
                        <p className="text-muted-foreground text-center">
                            No videos found in the library.
                        </p>
                    </div>
                )}
            </div>
            <EditVideoLibraryModal
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
        </div>
    );
}