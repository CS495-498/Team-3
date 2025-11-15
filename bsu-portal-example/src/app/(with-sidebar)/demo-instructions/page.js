"use client";
import React, { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";

import { Card } from "@/components/ui/card";
import BookmarkButton from "@/components/bookmark-button";
import { BOOKMARK_TYPES, useBookmarks } from "@/hooks/use-bookmarks";

export default function DemoInstructions() {
    const [entry, setEntry] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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

                <div className="flex items-center gap-2 mr-4">
                    <button
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
