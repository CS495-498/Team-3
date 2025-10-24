"use client";
import React, {useState, useEffect} from "react";
import Stack, {onEntryChange} from "@/lib/cstack";
import { ChevronsUp, ChevronsDown } from 'lucide-react';

export default function Home() {
    const [entry, setEntry] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const getContent = async () => {
        const entry = await Stack.getElementByTypeWithRefs(
            "feature_requests",
            "en-us",
            ["requests"
            ]
        );
        console.log("homepage", entry[0][0]);
        setEntry(entry[0][0]);
        setIsLoading(false);
    };

    useEffect(() => {
        onEntryChange(getContent);
    }, []);

    if (isLoading) return <div></div>

    return (
        <main className="pt-6 px-10 min-h-screen w-full">

            <div className="flex justify-between items-center mb-6 pt-6">
                <h1 className="text-4xl font-bold ml-4">
                    {entry?.title}
                </h1>
            </div>

            <ul className="divide-y divide-gray-200">
                {entry?.requests?.map((req, idx) => (
                    <li
                        key={idx}
                        className="flex items-center py-4 hover:bg-gray-100 transition-colors odd:bg-gray-50 even:bg-white"
                    >
                        <div className="flex flex-col items-center space-y-2 ml-4">
                            <button className="p-1 rounded-md hover:bg-gray-100 transition">
                                <ChevronsUp className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-gray-800">12</span>
                            <button className="p-1 rounded-md hover:bg-gray-100 transition">
                                <ChevronsDown className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="ml-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {req?.request.feature_title || "Untitled Request"} - {req?.request.author || "Anonymous"}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {req?.request.feature_description || "No description provided."}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </main>
    );
}
