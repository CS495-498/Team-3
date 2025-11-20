"use client";
import React, { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { useRef } from "react";

import { Card } from "@/components/ui/card";
import BookmarkButton from "@/components/bookmark-button";
import { BOOKMARK_TYPES, useBookmarks } from "@/hooks/use-bookmarks";

export default function DemoInstructions() {
    const [uploadError, setUploadError] = useState("");
    const [entry, setEntry] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false)
    const [dialogEditorContent, setDialogEditorContent] = useState("");
    const editorRef = useRef(null);

    const {
        isBookmarked,
        toggleBookmark,
        isPending,
    } = useBookmarks(BOOKMARK_TYPES.DEMO_INSTRUCTION);

    const getContent = async () => {
        const entry = await Stack.getElementByTypeWithRefs(
            "demo_instructions",
            "en-us",
            ["demo_instructions"]
        );

        setEntry(entry[0][0]);
        setIsLoading(false);
    };

    useEffect(() => {
        onEntryChange(getContent);
    }, []);

    const handleSubmit = async (e) => { };

    const filteredDemos = entry?.demo_instructions?.filter((demo) => {
        const query = searchQuery.toLowerCase();
        return (
            demo.title?.toLowerCase().includes(query) ||
            demo.author_name?.toLowerCase().includes(query)
        );
    }) || [];

    const getInstructionId = (demo) =>
        demo?.uid || demo?.url || demo?.title;

    const handleBookmarkToggle = async (demo) => {
        const resourceId = getInstructionId(demo);
        if (!resourceId) {
            alert("Unable to bookmark this instruction. Missing identifier.");
            return;
        }

        const result = await toggleBookmark(resourceId, {
            title: demo?.title,
            description: demo?.author_name,
            url: demo?.url,
            extra: { type: "demoInstruction" },
        });

        if (result?.error === "AUTH_REQUIRED") {
            alert("Please sign in to bookmark demo instructions.");
        } else if (result?.error) {
            alert("Could not update bookmark. Please try again.");
        }
    };

    if (isLoading) return <div className="p-10">Loading…</div>;

    return (
        <div className="pl-10 pt-6 min-h-screen flex flex-col w-full">
            <div className="flex justify-between items-center mb-6 pt-6">
                <h1 className="text-4xl font-bold ml-4">{entry?.title}</h1>
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
                                    className="w-full max-w-5xl mx-auto"
                                    initial={{ opacity: 0, scale: 0.96, y: -8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96, y: -8 }}
                                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <Dialog.Panel
                                        className="
                    w-full
                    max-w-5xl
                    h-[95vh]
                    max-h-[95vh]
                    flex
                    flex-col
                    bg-white
                    dark:bg-gray-700
                    rounded-xl
                    shadow-2xl
                    overflow-hidden
                "
                                    >

                                        {/* Sticky Header */}
                                        <div className="sticky top-0 bg-white dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600 z-10 flex items-center justify-between">
                                            <Dialog.Title className="font-bold text-2xl">Add Instructions</Dialog.Title>
                                            {uploadError && (
                                                <p className="text-red-500 text-sm mb-2">{uploadError}</p>
                                            )}

                                            <div className="flex items-center gap-3">
                                                {/* Cancel button moved to top */}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsOpen(false)}
                                                    className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                                >
                                                    Cancel
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        setUploadError(""); // reset error on new attempt

                                                        const html = editorRef.current?.getHTML();
                                                        const title = document.querySelector("input[name='title']").value;
                                                    

                                                        const res = await fetch("/api/demo-instructions", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ title, html }),
                                                        });

                                                        const data = await res.json();

                                                        if (data.success) {
                                                            console.log("Uploaded successfully:", data);
                                                            setIsOpen(false); // close dialog
                                                            setUploadError("");
                                                            getContent(); // optionally refresh list
                                                        } else {
                                                            console.error("Upload failed:", data.error, data.details);
                                                            // Check for Contentstack unique title error code 119
                                                            if (data.details?.error_code === 119) {
                                                                setUploadError("Title must be unique. Please choose a different title.");
                                                            } else {
                                                                setUploadError("Failed to upload demo instruction. Please try again.");
                                                            }
                                                        }
                                                    }}
                                                    className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                                                >
                                                    Upload
                                                </button>

                                            </div>
                                        </div>

                                        {/* Scrollable Content */}
                                        <div className="flex-1 overflow-y-auto p-8">

                                            <form id="dialogForm" onSubmit={handleSubmit} className="space-y-5 w-full">

                                                {/* Title input */}
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

                                                {/* Rich Text Editor */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                        Demo Content
                                                    </label>

                                                    <div className="w-full min-h-[300px] rounded-md p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                                                        <SimpleEditor html={dialogEditorContent} editorRef={editorRef} />
                                                    </div>
                                                </div>

                                            </form>
                                        </div>

                                    </Dialog.Panel>
                                </motion.div>
                            </div>
                        </Dialog>



                    )}
                </AnimatePresence>


                <div className="flex items-center gap-2 mr-4">
                    <button
                        onClick={() => setIsOpen(true)}
                        type="button"
                        className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                    >
                        + Demos
                    </button>

                    <div className="relative w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="Search instructions..."
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
                </div>
            </div>

            <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 me-10">
                    {filteredDemos.map((demo, idx) => {
                        const instructionId = getInstructionId(demo);
                        const key = instructionId ? `${instructionId}-${idx}` : `instruction-${idx}`;

                        const previewHTML = DOMPurify.sanitize(
                            demo?.blog_content || "<p>No preview available.</p>"
                        );

                        return (
                            <div key={key} className="relative group">
                                <Link
                                    href={demo?.url || "#"}
                                    className="group block h-full bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 overflow-hidden"
                                >

                                    <div
                                        className="relative bg-white"
                                        style={{
                                            height: "300px",
                                            padding: "20px",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            className="prose prose-sm max-w-none text-gray-700"
                                            dangerouslySetInnerHTML={{ __html: previewHTML }}
                                        />

                                        <div
                                            className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
                                            style={{
                                                background:
                                                    "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 85%)",
                                            }}
                                        />
                                    </div>

                                    <div className="px-4 py-4 bg-white flex flex-col gap-2">

                                        {/* Title Row */}
                                        <div className="flex items-center gap-2">
                                            {/* Document Icon */}
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#7C3AED"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="shrink-0"
                                            >
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <line x1="9" y1="13" x2="15" y2="13" />
                                                <line x1="9" y1="17" x2="15" y2="17" />
                                                <line x1="9" y1="9" x2="11" y2="9" />
                                            </svg>

                                            <h2 className="text-lg font-semibold line-clamp-1">
                                                {demo?.title}
                                            </h2>
                                        </div>

                                        {/* Author Row */}
                                        <div className="flex items-center gap-2 text-gray-500">
                                            {/* Person Icon */}
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="#7C3AED"
                                                className="shrink-0"
                                            >
                                                <circle cx="12" cy="8" r="4" />
                                                <path d="M4 20c0-4 4-6 8-6s8 2 8 6v1H4v-1z" />
                                            </svg>

                                            <p className="text-sm line-clamp-1">
                                                {demo?.author_name || ""}
                                            </p>
                                        </div>
                                    </div>
                                </Link>


                                <BookmarkButton
                                    active={instructionId ? isBookmarked(instructionId) : false}
                                    disabled={!instructionId || isPending(instructionId)}
                                    onToggle={() => handleBookmarkToggle(demo)}
                                    className="absolute top-3 right-3 shadow-md"
                                    titleWhenActive="Remove instruction from bookmarks"
                                    titleWhenInactive="Save instruction to bookmarks"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
