"use client";

import postAsset from "@/app/api/helper/postAsset";
import appendVideo from "@/app/api/helper/appendVideo";

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

/* ---------------------------------------------------------------------------------------
   EMBED DETECTOR — NOW INCLUDED IN THIS FILE
--------------------------------------------------------------------------------------- */
function getVideoEmbed(video) {
    const url = video?.video_url || video?.video_file?.url;
    if (!url) return null;

    // YouTube
    const youtubeMatch = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
    );
    if (youtubeMatch) {
        return {
            type: "youtube",
            id: youtubeMatch[1],
            embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
        };
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        return {
            type: "vimeo",
            id: vimeoMatch[1],
            embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        };
    }

    // Direct video file (mp4, webm, etc)
    if (url.match(/\.(mp4|mov|webm|m4v)$/i) || video?.video_file?.url) {
        return {
            type: "file",
            embedUrl: url,
        };
    }

    return null;
}

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
        const thumbnailFile = data.get("thumbnail");

        const titleProvided = title?.trim().length > 0;
        const urlProvided = videoURL && videoURL.length > 0;
        const fileProvided = videoFile && videoFile.size > 0;

        // VALIDATION: title & (file XOR URL)
        if (!titleProvided || (!fileProvided && !urlProvided) || (fileProvided && urlProvided)) {
            alert("Please provide a title and either a video file OR a video URL.");
            return;
        }

        try {
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

            const uploadedThumb =
                thumbnailFile && thumbnailFile.size > 0
                    ? await postAsset(
                        thumbnailFile,
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
            setShowToast(true);

            setTimeout(() => {
                setShowToast(false);
            }, 2000);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to add video. Check console for details.");
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
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                    >
                        Add Video
                    </button>

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
                                onClose={() => (setIsOpen(false))}

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
                                                <button onClick={() => (setIsOpen(false))}>
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
                                                                className="w-full text-sm text-gray-700 dark:text-gray-200
                          file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                          file:text-sm file:font-medium file:bg-gray-400 file:text-white
                          hover:file:bg-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                          rounded-lg px-2 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500
                          outline-none transition"/>
                                                            <small className="text-gray-600">File will remain unchanged if left blank.</small>
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
                                                            name="link"
                                                            type="url"
                                                            placeholder="https://youtube.com/watch?v=VIDEO"
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

                                                    <div>
                                                        <label className="block text-sm font-medium dark:text-gray-200">
                                                            Thumbnail
                                                        </label>
                                                        <input
                                                            name="thumbnail"
                                                            type="file"
                                                            accept="image/*"
                                                            className="w-full text-sm text-gray-700 dark:text-gray-200
                          file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                          file:text-sm file:font-medium file:bg-gray-400 file:text-white
                          hover:file:bg-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                          rounded-lg px-2 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500
                          outline-none transition"
                                                        />
                                                    </div>
                                                    <small className="text-gray-600">File will remain unchanged if left blank.</small>
                                                </div>

                                                {/* Footer Buttons */}
                                                <div className="flex justify-end gap-3 pt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => (setIsOpen(false))}
                                                        className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition"
                                                    >
                                                        Save Video
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
                                            <CardHeader className="flex-grow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <CardTitle className="text-lg font-semibold leading-tight line-clamp-1">
                                                        {video.title}
                                                    </CardTitle>
                                                    <CardDropdown
                                                        onEdit={() => openEditModal(video)}
                                                        onDelete={() => openDeleteModal(video)}
                                                    />
                                                </div>
                                            </CardHeader>

                                            <CardFooter>
                                                {video.date_posted && (
                                                    <p className="text-xs">
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
