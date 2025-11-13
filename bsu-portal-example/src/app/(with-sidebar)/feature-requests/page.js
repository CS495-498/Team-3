"use client";
import React, { useState, useEffect } from "react";
import { ChevronsUp, ChevronsDown } from "lucide-react";

export default function Home() {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [votes, setVotes] = useState({});

    // Fetch data from your API endpoint
    const getContent = async () => {
        try {
            const res = await fetch("/api/feature-requests"); //connects to the api endpoint in the API folder
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setRequests(data);
        } catch (error) {
            console.error("Error fetching feature requests:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getContent();
    }, []);

    const handleVote = (id, type) => {
        setVotes((prev) => {
            const current = prev[id];
            if (current === type) return { ...prev, [id]: null };
            return { ...prev, [id]: type };
        });
    };

    if (isLoading) return <div className="p-10 text-gray-500">Loading...</div>;

    return (
        <main className="pt-6 px-10 min-h-screen w-full">
            <div className="flex justify-between items-center mb-6 pt-6">
                <h1 className="text-4xl font-bold ml-4">Feature Requests</h1>
            </div>

            {requests.length === 0 ? (
                <p className="text-gray-600 ml-4">No feature requests found.</p>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {requests.map((req, idx) => {
                        const voteState = votes[req.id];
                        return (
                            <li key={req.id || idx}
                                className="flex items-center py-4 transition-colors
                              hover:bg-gray-100 dark:hover:bg-gray-800
                              odd:bg-gray-50 even:bg-white
                              dark:odd:bg-gray-900 dark:even:bg-gray-950"
                            >
                                <div className="flex flex-col items-center space-y-2 ml-4">
                                    <button
                                        className={`p-1 rounded-md transition ${
                                            voteState === "up" ? "text-green-600" : "text-gray-700 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        }`}
                                        onClick={() => handleVote(req.id, "up")}
                                    >
                                        <ChevronsUp className="w-5 h-5 dark:" />
                                    </button>

                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-50">12</span>

                                    <button
                                        className={`p-1 rounded-md transition ${
                                            voteState === "down" ? "text-red-600" : "text-gray-700 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        }`}
                                        onClick={() => handleVote(req.id, "down")}
                                    >
                                        <ChevronsDown className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="ml-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                                        {req.title || "Untitled Request"}{" "}
                                        <span className="text-sm text-gray-500 dark:text-gray-50">
                      — {req.user_id || "Anonymous"}
                    </span>
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-50">
                                        {req.content || "No description provided."}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 dark:text-gray-50">
                                        Created: {new Date(req.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </main>
    );
}
