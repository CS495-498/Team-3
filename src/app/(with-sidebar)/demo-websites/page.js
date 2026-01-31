"use client";
import React, { useState, useEffect, Fragment, useMemo } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import Link from "next/link";
import Image from "next/image";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import BookmarkButton from "@/components/bookmark-button";
import { BOOKMARK_TYPES, useBookmarks } from "@/hooks/use-bookmarks";
import appendDemoWebsite from "@/app/api/helper/appendDemoWebsite";
import postAsset from "@/app/api/helper/postAsset";
import SuccessToast from "@/components/ui/success-toast.jsx";
import LoadingIndicator from "@/components/ui/loading-indicator.jsx";
import { AnimatePresence, motion } from "framer-motion";
import normalizeDemoWebArray from "@/app/api/helper/normalizeDemoWebArray";


import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Dialog } from "@headlessui/react";
import CardDropdown from "@/components/cardDropdown.jsx";

import EditDemoWebsiteModal from "@/components/editDemoWebsiteModal.jsx";
import DeleteModal from "@/components/deleteModal";

export default function Demos() {
    const [entry, setEntry] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [isOpen, setIsOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");


    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const {
        isBookmarked,
        toggleBookmark,
        isPending,
    } = useBookmarks(BOOKMARK_TYPES.DEMO_WEBSITE);
    const getContent = async () => {
        const entry = await Stack.getElementByTypeWithRefs(
            "custom_demos",
            "en-us",
            ["demos"
            ]
        );
        console.log("CMS Entry:", entry);
        console.log("Demo:", entry);

        setEntry(entry[0][0]);
        setIsLoading(false);
    };

    useEffect(() => {
        onEntryChange(getContent);
    }, []);

    const getDemoId = (demo) =>
        demo?.uid ||
        demo?.system?.uid ||
        demo?.link?.href ||
        demo?.title;

    const demos = entry?.demos?.filter((demo) => {
        const query = searchQuery.toLowerCase();
        return (
            demo.title?.toLowerCase().includes(query) ||
            demo.description?.toLowerCase().includes(query)
        );
    }) || [];

    const sortedDemos = useMemo(() => {
        if (!demos.length) return [];
        return [...demos].sort((a, b) => {
            const aBookmarked = isBookmarked(getDemoId(a));
            const bBookmarked = isBookmarked(getDemoId(b));
            if (aBookmarked === bBookmarked) return 0;
            return aBookmarked ? -1 : 1;
        });
    }, [demos, isBookmarked]);

    const { items: visibleDemos, hasMore, ref } = useInfiniteScroll(sortedDemos, 8);

    const openEditModal = (demo, index) => {
        setSelectedItem(demo);
        setSelectedIndex(index);
        setIsEditOpen(true);
    };

    const openDeleteModal = (demo, index) => {
        setSelectedItem(demo);
        setSelectedIndex(index);
        setIsDeleteOpen(true);
    };

    const handleBookmarkToggle = async (demo) => {
        const resourceId = getDemoId(demo);
        if (!resourceId) {
            alert("Unable to bookmark this demo because it is missing an identifier.");
            return;
        }
        const result = await toggleBookmark(resourceId, {
            title: demo?.title,
            description: demo?.description,
            url: demo?.link?.href,
            thumbnail: demo?.image?.url,
            extra: {
                type: "demoWebsite",
            },
        });

        if (result?.error === "AUTH_REQUIRED") {
            alert("Please sign in to bookmark demos.");
        } else if (result?.error) {
            alert("Could not update bookmark. Please try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const form = e.target;
        const data = new FormData(form);
        const json_data = {};

        for (let [key, value] of data.entries()) {
            if (value instanceof File && value.size > 0) {
                json_data[key] = value.name;
            } else {
                json_data[key] = value;
            }
        }

        try {
            setIsSubmitting(true); // START LOADING

            const thumbnailFile = data.get("image");
            const demoUrl = json_data.url;

            if (!json_data.title?.trim()) {
                alert("Please provide a title.");
                setIsSubmitting(false); // STOP LOADING
                return;
            }

            let uploadedThumb = null;

            // Option 1: Manual upload takes precedence
            if (thumbnailFile && thumbnailFile.size > 0) {
                uploadedThumb = await postAsset(
                    thumbnailFile,
                    `${json_data.title} Thumbnail`,
                    "Demo thumbnail",
                    null,
                    "demo-thumbnails"
                );
            // Option 2: Auto-capture screenshot if URL provided and no manual upload
            else if (demoUrl) {
                const screenshotResponse = await fetch('/api/capture-screenshot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: demoUrl })
                });

                if (screenshotResponse.ok) {
                    const { screenshot } = await screenshotResponse.json();

                    const blob = await fetch(`data:image/jpeg;base64,${screenshot}`).then(r => r.blob());
                    const screenshotFile = new File([blob], `${json_data.title}-screenshot.jpg`, { type: 'image/jpeg' });

                    uploadedThumb = await postAsset(
                        screenshotFile,
                        `${json_data.title} Thumbnail`,
                        "Auto-generated demo thumbnail",
                        null,
                        "demo-thumbnails"
                    );
                } else {
                    console.warn('Screenshot capture failed, proceeding without thumbnail');
                }
            }

            const newDemo = {
                link: {
                    title: json_data.title || "Demo Link",
                    href: json_data.url || "",
                },
                image: uploadedThumb?.asset?.uid || null,
                title: json_data.title,
                description: json_data.description,
                se_name: json_data.se_name,
                date_posted: json_data.date_posted || new Date().toISOString(),
            };

            const updatedDemoWebsites = appendDemoWebsite(entry, newDemo);

            const response = await fetch("/api/update-demo-web-in-cs", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entryUid: entry.uid,
                    demos: updatedDemoWebsites,
                }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Update failed: ${response.status} ${text}`);
            }

            const updatedEntry = await response.json();
            setEntry(updatedEntry.entry);

            setIsOpen(false);
            setToastMessage("Demo website added!");
            setShowToast(true);

            setTimeout(() => {
                setShowToast(false);
            }, 2000);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to add demo. Check console for details.");
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleEditSave = async (e) => {
        e.preventDefault();

        try {
            if (selectedItem == null || selectedIndex == null) return;

            setIsSubmitting(true);

            const form = e.target;
            const data = new FormData(form);

            const newTitle = data.get("title");
            const newDescription = data.get("description");
            const newLinkTitle = data.get("link");
            const newImageFile = data.get("image");


            let imageUid = selectedItem.image?.uid || selectedItem.image || null;

            if (newImageFile && newImageFile.size > 0) {
                const uploaded = await postAsset(
                    newImageFile,
                    `${newTitle} Thumbnail`,
                    "Demo thumbnail",
                    null,                     
                    null,
                    "demo-thumbnails"
                );

                imageUid = uploaded?.asset?.uid || null;
            }

            const updatedItem = {
                ...selectedItem,
                title: newTitle,
                description: newDescription,
                link: {
                    title: newTitle,
                    href: newLinkTitle,
                },
                image: imageUid,
            };

            console.log("Updated Item:", updatedItem);

            const updatedArray = [...entry.demos];
            updatedArray[selectedIndex] = updatedItem;

            const normalized = normalizeDemoWebArray(updatedArray);

            const response = await fetch("/api/update-demo-web-in-cs", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entryUid: entry.uid,
                    demos: normalized,
                }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }

            const updatedEntry = await response.json();
            setEntry(updatedEntry.entry);
            setIsEditOpen(false);

            setToastMessage("Demo updated successfully!");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);

        } catch (error) {
            console.error("Edit failed:", error);
            alert("Failed to update demo.");
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleConfirmDelete = async () => {
        try {
            if (!selectedItem) return;

            const selectedId = getDemoId(selectedItem);
            if (!selectedId) throw new Error("Selected demo has no identifier.");

            // Remove by id, not index
            const updatedArray = (entry.demos || []).filter(d => getDemoId(d) !== selectedId);

            const normalized = normalizeDemoWebArray(updatedArray);

            const response = await fetch("/api/update-demo-web-in-cs", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entryUid: entry.uid,
                    demos: normalized,
                }),
            });

            if (!response.ok) throw new Error(await response.text());

            const result = await response.json();
            setEntry(result.entry);

            setIsDeleteOpen(false);
            setToastMessage("Demo deleted successfully!");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete demo.");
        }
    };



    if (isLoading) {
        return <LoadingIndicator label="Loading demo websites..." />;
    }

    return (
        <div className="pl-10 pt-6 min-h-screen flex flex-col">
            <SuccessToast
                message={toastMessage}
                isOpen={showToast}
                onClose={() => setShowToast(false)}
            />
            <div className="flex justify-between items-center mb-6 pt-6">
                <h1 className="text-4xl font-bold ml-4">
                    {entry?.title}
                </h1>
                <div className="flex items-center gap-2 mr-4">
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                    >
                        Add Demo
                    </button>

                    <div className="relative w-full max-w-sm dark:text-black">
                        <input
                            type="text"
                            placeholder="Search websites..."
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
                                onClose={() => setIsOpen(false)}
                            >
                                <motion.div
                                    className="fixed inset-0 bg-black/50"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    aria-hidden="true"
                                />

                                <div className="fixed inset-0 flex items-center justify-center p-6">
                                    <motion.div
                                        className="w-full max-w-xl mx-auto"
                                        initial={{ opacity: 0, scale: 0.96, y: -8 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <Dialog.Panel className="w-full rounded-xl bg-white dark:bg-gray-700 p-8 shadow-2xl">
                                            <Dialog.Title className="font-bold text-2xl mb-4">Add A Demo</Dialog.Title>

                                            <form onSubmit={handleSubmit} className="space-y-5 w-full">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                        Title
                                                    </label>
                                                    <input
                                                        name="title"
                                                        type="text"
                                                        placeholder="Enter demo title"
                                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                        Demo Description
                                                    </label>
                                                    <textarea
                                                        name="description"
                                                        rows="3"
                                                        placeholder="Describe the demo..."
                                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                                                    ></textarea>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                        Link
                                                    </label>
                                                    <input
                                                        name="url"
                                                        type="text"
                                                        placeholder="Enter Demo URL"
                                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                        Thumbnail <span className="text-gray-500 text-xs">(optional - will auto-capture from URL)</span>
                                                    </label>
                                                    <input
                                                        name="image"
                                                        type="file"
                                                        accept="image/*"
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
                                                        disabled={isSubmitting}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                <span>Uploading...</span>
                                                            </>
                                                        ) : (
                                                            "Save Demo"
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
            <div className="flex-1">
                {visibleDemos.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 me-10">
                            {visibleDemos.map((demo, idx) => {
                                const demoId = getDemoId(demo);
                                const key = demoId ? `${demoId}-${idx}` : `demo-${idx}`;
                                return (
                                    <div key={key} className="relative group">
                                        <Card className="h-85 flex flex-col rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-800">
                                            {demo?.image?.url && (
                                                <div className="relative w-full aspect-video">
                                                    <Link href={demo?.link?.href || "#"} target="_blank" rel="noopener noreferrer">
                                                        <Image
                                                            src={demo.image.url}
                                                            alt={demo.title || "Demo image"}
                                                            fill
                                                            className="object-cover rounded-t-xl"
                                                        />
                                                    </Link>
                                                </div>
                                            )}

                                            <CardHeader className="p-6 flex flex-col flex-grow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <CardTitle className="text-lg font-semibold leading-tight line-clamp-1">
                                                        {demo?.title}
                                                    </CardTitle>
                                                    <CardDropdown
                                                        onEdit={() => openEditModal(demo, idx)}
                                                        onDelete={() => openDeleteModal(demo, idx)}
                                                    />
                                                </div>
                                                <CardDescription
                                                    className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed overflow-y-auto pr-2"
                                                    style={{ maxHeight: "85px" }}
                                                >
                                                    {demo?.description}
                                                </CardDescription>
                                            </CardHeader>
                                        </Card>

                                        <BookmarkButton
                                            active={demoId ? isBookmarked(demoId) : false}
                                            disabled={!demoId || isPending(demoId)}
                                            onToggle={() => handleBookmarkToggle(demo)}
                                            className="absolute top-3 right-3 shadow-md"
                                            titleWhenActive="Remove demo from bookmarks"
                                            titleWhenInactive="Save demo to bookmarks"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        {hasMore && (
                            <div ref={ref} className="flex flex-col justify-center items-center py-8 mt-6">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm">{isLoading ? "Loading more demos..." : "Loading more demos..."}</span>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    Showing {visibleDemos.length} of {demos.length} demos
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center py-12 mt-6">
                        <p className="text-gray-500 dark:text-gray-400">No demos found.</p>
                    </div>
                )}
            </div>

            <EditDemoWebsiteModal
                isOpen={isEditOpen}
                closeModal={() => setIsEditOpen(false)}
                onSave={handleEditSave}
                item={selectedItem}
                index={selectedIndex}
                isSubmitting={isSubmitting}
            />

            <DeleteModal
                isOpen={isDeleteOpen}
                closeModal={() => setIsDeleteOpen(false)}
                onDeleteConfirm={handleConfirmDelete}
            />
        </div>
    );
}
