"use client";
import React, { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import Link from "next/link";
import Image from "next/image";
import BookmarkButton from "@/components/bookmark-button";
import { BOOKMARK_TYPES, useBookmarks } from "@/hooks/use-bookmarks";


import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"



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
            ["demo_instructions"
            ]
        );


        setEntry(entry[0][0]);
        console.log("Instructions Entry:", entry);
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
        demo?.uid ||
        demo?.url ||
        demo?.title;

    const handleBookmarkToggle = async (demo) => {
        const resourceId = getInstructionId(demo);
        if (!resourceId) {
            alert("Unable to bookmark this instruction yet. Missing identifier.");
            return;
        }

        const result = await toggleBookmark(resourceId, {
            title: demo?.title,
            description: demo?.author_name,
            url: demo?.url,
            thumbnail: demo?.image?.url,
            extra: {
                type: "demoInstruction",
            },
        });

        if (result?.error === "AUTH_REQUIRED") {
            alert("Please sign in to bookmark demo instructions.");
        } else if (result?.error) {
            alert("Could not update bookmark. Please try again.");
        }
    };

    if (isLoading) return <div>Loading...</div>

    return (
        <div className="pl-10 pt-6 min-h-screen flex flex-col w-full">
            <div className="flex justify-between items-center mb-6 pt-6">
                <h1 className="text-4xl font-bold ml-4">
                    {entry?.title}
                </h1>
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
                            placeholder="Search demos..."
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
                        return (
                            <div key={key} className="relative group">
                                <Link href={demo?.url || "#"} className="group block h-full">
                                    <Card className="h-full shadow-md hover:shadow-lg transition-shadow duration-200">
                                        {demo?.image?.url && (
                                            <div className="relative w-full h-48">
                                                <Image
                                                    src={demo.image.url}
                                                    alt={demo.title || "Demo image"}
                                                    fill
                                                    className="object-cover rounded-t-lg group-hover:opacity-90 transition-opacity"
                                                />
                                            </div>
                                        )}
                                        <CardHeader>
                                            <CardTitle>{demo?.title}</CardTitle>
                                            <CardDescription>{demo?.author_name}</CardDescription>
                                        </CardHeader>
                                    </Card>
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
