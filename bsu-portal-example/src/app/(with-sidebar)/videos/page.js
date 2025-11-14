"use client";

import postAsset from "@/app/api/postAsset";
import appendVideo from "@/app/api/appendVideo";

import React, { useState, useEffect, Fragment } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import BookmarkButton from "@/components/bookmark-button";
import { BOOKMARK_TYPES, useBookmarks } from "@/hooks/use-bookmarks";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {Dialog, Transition } from '@headlessui/react'


export default function VideoLibrary() {
  const [entry, setEntry] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    isBookmarked,
    toggleBookmark,
    isPending,
  } = useBookmarks(BOOKMARK_TYPES.VIDEO);

  const getVideoId = (video) =>
    video?.uid ||
    video?.system?.uid ||
    video?.video_file?.uid ||
    video?.se_name ||
    video?.title;

  const handleBookmarkToggle = async (video) => {
    const resourceId = getVideoId(video);
    if (!resourceId) {
      alert("Unable to bookmark this video because it is missing an identifier.");
      return;
    }

    const result = await toggleBookmark(resourceId, {
      title: video?.title,
      description: video?.description,
      url: video?.video_file?.url,
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


  const getContent = async () => {
    try {
      const entry = await Stack.getElementByTypeWithRefs(
        "video_library",
        "en-us",
        ["videos"]
      );

      console.log("Video Library Entry:", entry[0][0]);
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

  // Infinite scroll pagination
  const videos = entry?.videos?.filter((video) => {
        const query = searchQuery.toLowerCase();
        return (
            video.title?.toLowerCase().includes(query) ||
            video.se_name?.toLowerCase().includes(query) ||
            video.description?.toLowerCase().includes(query)
        );
    }) || [];
  const { items: visibleVideos, hasMore, ref } = useInfiniteScroll(videos, 6);

    const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    const data = new FormData(form);
    const json_data = {};

    // Step 1: Collect all form fields
    for (let [key, value] of data.entries()) {
        if (value instanceof File && value.size > 0) {
        json_data[key] = value.name;
        } else {
        json_data[key] = value;
        }
    }

    try {
        const videoFile = data.get("video_file");
        const thumbnailFile = data.get("thumbnail");

        // Require a title and a valid video file
        const titleProvided = json_data.title?.trim()?.length > 0;
        const videoProvided = videoFile && videoFile.size > 0;

        if (!titleProvided || !videoProvided) {
        alert("Please provide both a title and a video file before submitting.");
        return;
        }

        // Step 2: Upload video and thumbnail assets
        const uploadedVideo =
        videoProvided
            ? await postAsset(
                videoFile,
                json_data.title,
                json_data.description,
                null,
                "video-library"
            )
            : null;

        const uploadedThumb =
        thumbnailFile && thumbnailFile.size > 0
            ? await postAsset(
                thumbnailFile,
                `${json_data.title} Thumbnail`,
                "Video thumbnail",
                null,
                "video-thumbnails"
            )
            : null;

        // Step 3: Build the new video object
        const newVideo = {
        video_file: uploadedVideo?.asset?.uid || null,
        thumbnail: uploadedThumb?.asset?.uid || null,
        title: json_data.title,
        description: json_data.description,
        se_name: json_data.se_name,
        date_posted: json_data.date_posted || new Date().toISOString(),
        };

        // Step 4: Use helper to append the new video
        const updatedVideos = appendVideo(entry, newVideo);

        // Step 5: Send PUT request to update the video_library entry
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
        console.log("Updated library:", updatedEntry);

        alert("Video successfully added!");
        setIsOpen(false);
        setEntry(updatedEntry.entry);
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to add video. Check console for details.");
    }
    };


    let [isOpen, setIsOpen] = useState(false)

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading videos...</div>;

    return (
        <div className="pl-10 pt-6 min-h-screen flex flex-col">
            <div className="flex justify-between items-center mb-6 pt-6">
                <h1 className="text-4xl font-bold ml-4">{entry?.title}</h1>

                <div className="flex items-center gap-3 mr-4">
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                    >
                        + Videos
                    </button>
                    <div className="relative w-full max-w-sm dark:text-black">
                        <input
                            type="text"
                            placeholder="Search videos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
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
                    <Transition appear show={isOpen} as={Fragment}>
                        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
                            </Transition.Child>

                            <div className="fixed inset-0 flex items-center justify-center p-4">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-700 shadow-2xl p-8 transition-all">
                                        <h4 className="font-bold text-2xl mb-4">Add A Video</h4>
                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    Title
                                                </label>
                                                <input
                                                    type="text"
                                                    name="title"
                                                    placeholder="Enter video title"
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    Video Description
                                                </label>
                                                <textarea
                                                    rows="3"
                                                    name="description"
                                                    placeholder="Describe the video..."
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                                                ></textarea>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    Date Posted
                                                </label>
                                                <input
                                                    type="date"
                                                    name="date_posted"
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    SE Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="se_name"
                                                    placeholder="Enter SE Name"
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    Video File
                                                </label>
                                                <input
                                                    type="file"
                                                    name="video_file"
                                                    accept="video/*"
                                                    className="w-full text-sm text-gray-700 dark:text-gray-200
                                                             file:mr-4 file:py-2 file:px-4
                                                             file:rounded-lg file:border-0
                                                             file:text-sm file:font-medium
                                                             file:bg-gray-400 file:text-white
                                                             hover:file:bg-gray-500
                                                             bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                                                             rounded-lg px-2 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500
                                                             outline-none transition"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    Thumbnail File
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    name="thumbnail"
                                                    className="w-full text-sm text-gray-700 dark:text-gray-200
                                                             file:mr-4 file:py-2 file:px-4
                                                             file:rounded-lg file:border-0
                                                             file:text-sm file:font-medium
                                                             file:bg-gray-400 file:text-white
                                                             hover:file:bg-gray-500
                                                             bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                                                             rounded-lg px-2 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500
                                                             outline-none transition"
                                                />
                                            </div>

                                            <div className="flex justify-end gap-3 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsOpen(false)}
                                                    className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    onClick={() => setIsOpen(false)}
                                                    className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                                                    >
                                                    Save Video
                                                </button>
                                            </div>
                                        </form>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </Dialog>
                    </Transition>
                </div>
            </div>
            <div className="flex-1">
                {visibleVideos.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 me-10">
                        {visibleVideos.map((video, index) => {
                            const videoId = getVideoId(video);
                            const key = videoId ? `${videoId}-${index}` : `video-${index}`;
                            return (
                                <div key={key} className="relative">
                                    <Card
                                        className="h-[350px] flex flex-col shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                                    >
                                        <div className="relative w-full h-[2300px] bg-black rounded-t-lg overflow-hidden">
                                        {playingIndex === index ? (
                                            <video
                                            className="w-full h-full object-cover"
                                            controls
                                            autoPlay
                                            poster={video?.thumbnail?.url || ""}
                                            >
                                            <source src={video?.video_file?.url} type="video/mp4" />
                                            Your browser does not support the video tag.
                                            </video>
                                        ) : (
                                            <>
                                            <img
                                                src={video?.thumbnail?.url}
                                                alt={video?.title || "Video thumbnail"}
                                                className="w-full h-full object-cover cursor-pointer transition-opacity hover:opacity-80"
                                                onClick={() => setPlayingIndex(index)}
                                            />
                                            <div
                                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                                onClick={() => setPlayingIndex(index)}
                                            >
                                                <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="white"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
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
                                        )}
                                        </div>

                                        <CardHeader className="flex-grow flex flex-col justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-semibold truncate">
                                            {video.title}
                                            </CardTitle>
                                            {video.description && (
                                            <CardDescription className="line-clamp-3 text-gray-600 dark:text-gray-300">
                                                {video.description}
                                            </CardDescription>
                                            )}
                                        </div>
                                        </CardHeader>

                                        <CardFooter>
                                        {video.date_posted && (
                                            <p className="text-xs text-muted-foreground">
                                            Posted on {new Date(video.date_posted).toLocaleDateString()}
                                            </p>
                                        )}
                                        </CardFooter>
                                    </Card>
                                    <BookmarkButton
                                        active={videoId ? isBookmarked(videoId) : false}
                                        disabled={!videoId || isPending(videoId)}
                                        onToggle={() => handleBookmarkToggle(video)}
                                        className="absolute top-3 right-3 shadow-md"
                                        titleWhenActive="Remove video from bookmarks"
                                        titleWhenInactive="Save video to bookmarks"
                                    />
                                </div>
                            );
                        })}
                        </div>
                        {hasMore && (
                            <div ref={ref} className="flex flex-col justify-center items-center py-8 mt-6">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm">Loading more videos...</span>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
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
        </div>
    );
}
