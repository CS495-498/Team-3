"use client";
import React, { useState, useEffect, Fragment } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { CircleAlert } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import appendNotification from "@/app/api/helper/appendNotification.js";
import { motion, AnimatePresence } from "framer-motion";
import SuccessToast from "@/components/ui/success-toast.jsx";
import LoadingIndicator from "@/components/ui/loading-indicator.jsx";

export default function Home() {
    const [entry, setEntry] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    const getContent = async () => {
        console.log("Fetching homepage content...");
        const entry = await Stack.getElementByTypeWithRefs("homepage", "en-us", ["alerts"]);
        setEntry(entry[0][0]);
        setIsLoading(false);
    };

    useEffect(() => {
        onEntryChange(getContent);
    }, []);

    useEffect(() => {
        const message = localStorage.getItem("loginMessage");
        if (message) {
            setToastMessage(message);
            setShowToast(true);
            localStorage.removeItem("loginMessage");
            setTimeout(() => {
                setShowToast(false);
            }, 2000);
        }
    }, []);

    const alerts = entry?.alerts || [];
    const sortedAlerts = [...alerts].sort((a, b) => b.critical_value - a.critical_value);
    const { items: visibleAlerts, hasMore, ref, isLoading: isFetchingMore } = useInfiniteScroll(
        sortedAlerts,
        6
    );

    const getBgColor = (critical) => {
        switch (critical) {
            case 4:
                return "bg-red-500 text-white border-red-400";
            case 3:
                return "bg-orange-500 text-white border-orange-400";
            case 2:
                return "bg-yellow-500 text-white border-yellow-400";
            case 1:
                return "bg-green-500 text-white border-green-400";
            default:
                return "bg-green-500 text-white border-green-400";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const form = e.target;
            const data = new FormData(form);
            const json_data = {};

            for (let [key, value] of data.entries()) {
                json_data[key] = value instanceof File && value.size > 0 ? value.name : value;
            }

            const newNotification = {
                alert_title: json_data.alert_title,
                alert_description: json_data.alert_description,
                start_time: json_data.start_time,
                end_time: json_data.end_time,
                critical_value: parseInt(json_data.critical_value),
            };

            const updatedNotifications = appendNotification(entry, newNotification);

            const response = await fetch("/api/update-alerts-in-cs", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entryUid: entry.uid,
                    alerts: updatedNotifications,
                }),
            });

            if (!response.ok) {
                throw new Error(`Update failed`);
            }

            const updatedEntry = await response.json();
            setEntry(updatedEntry.entry);

            setModalOpen(false);
            setToastMessage("Notification added!");
            setShowToast(true);

            setTimeout(() => {
                setShowToast(false);
            }, 2000);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to add notification.");
        }
    };

    if (isLoading) {
        return <LoadingIndicator label="Loading dashboard..." />;
    }

    return (
        <main className="relative w-full min-h-screen overflow-hidden">
            <SuccessToast
                message={toastMessage}
                isOpen={showToast}
                onClose={() => setShowToast(false)}
            />
            <div className="flex flex-col w-full max-w-6xl mx-auto justify-start items-start relative z-10 p-8">
                <div className="flex flex-wrap items-start justify-between w-full mb-10">
                    <h1 className="text-4xl font-bold mt-10">Contentstack Portal</h1>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="mt-10 text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition"
                    >
                        Add Notification
                    </button>

                    <AnimatePresence>
                        {modalOpen && (
                            <Dialog
                                className="fixed inset-0 z-50"
                                open={modalOpen}
                                onClose={() => setModalOpen(false)}
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
                                            <Dialog.Title className="font-bold text-2xl mb-4">Add An Alert</Dialog.Title>

                                            <form onSubmit={handleSubmit} className="space-y-5 w-full">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                        Alert Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="alert_title"
                                                        placeholder="Enter alert title"
                                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                        Alert Description
                                                    </label>
                                                    <textarea
                                                        rows="3"
                                                        name="alert_description"
                                                        placeholder="Describe the alert..."
                                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                                                    ></textarea>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                        Start Time
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        name="start_time"
                                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                        End Time
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        name="end_time"
                                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                    />
                                                </div>

                                                <div className="flex flex-col">
                                                    <label htmlFor="critical_value" className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                        Critical Value
                                                    </label>
                                                    <input
                                                        id="critical_value"
                                                        type="number"
                                                        name="critical_value"
                                                        placeholder="Enter critical value"
                                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                    />
                                                </div>

                                                <div className="flex justify-end gap-3 pt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setModalOpen(false)}
                                                        className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                                                    >
                                                        Save Alert
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
                <div className="w-full mb-24 mt-3">
                    {visibleAlerts.length ? (
                        visibleAlerts.map((note, idx) => {
                            const bgColor = getBgColor(note?.critical_value);
                            return (
                                <div
                                    key={idx}
                                    className={`relative w-full rounded-xl border ${bgColor} p-5 mb-4 transition-transform duration-700 ease-in-out hover:scale-[1.02]`}
                                >
                                    <div className="flex items-start gap-3">
                                        <CircleAlert className="mt-1 shrink-0" />
                                        <div>
                                            <div className="font-semibold text-sm p-1">
                                                {note?.alert_title || "Untitled Notification"}
                                            </div>
                                            {note?.alert_description && (
                                                <div className="text-sm opacity-90 mt-1">{note.alert_description}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-gray-500 italic mt-3">No notifications</div>
                    )}

                    {hasMore && (
                        <div
                            ref={ref}
                            className="flex flex-col justify-center items-center py-8 mt-6 space-y-2"
                        >
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">
                                  {isFetchingMore ? "Loading more alerts..." : "Scroll to load more"}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Showing {visibleAlerts.length} of {alerts.length} alerts
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
