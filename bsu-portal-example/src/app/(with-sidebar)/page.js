"use client";
import React, { useState, useEffect, Fragment } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { CircleAlert } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import appendNotification from "@/app/api/appendNotification.js";

export default function Home() {
    const [entry, setEntry] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({});
    const [modalOpen, setModalOpen] = useState(false);

    const getContent = async () => {
        console.log("Fetching homepage content...");
        const entry = await Stack.getElementByTypeWithRefs("homepage", "en-us", ["alerts"]);
        setEntry(entry[0][0]);
        setIsLoading(false);
    };

    useEffect(() => {
        onEntryChange(getContent);
    }, []);

    const alerts = entry?.alerts || [];
    const sortedAlerts = [...alerts].sort((a, b) => b.critical_value - a.critical_value);
    const { items: visibleAlerts, hasMore, ref, isLoading: isFetchingMore } = useInfiniteScroll(sortedAlerts, 6);

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
        e.preventDefault(); // Prevent form from reloading the page
        try {
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
                const text = await response.text();
                throw new Error(`Update failed: ${response.status} ${text}`);
            }

            const updatedEntry = await response.json();
            console.log("Updated library:", updatedEntry);

            alert("Notification successfully added!");
            setEntry(updatedEntry.entry);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to add notification. Check console for details.");
        }
    };


    if (isLoading) return <div></div>;

    return (
        <main className="relative w-full min-h-screen overflow-hidden">
            <div className="flex flex-col w-full max-w-6xl mx-auto justify-start items-start relative z-10 p-8">
                <div className="flex flex-wrap items-start justify-between w-full mb-10">
                    <h1 className="text-4xl font-bold mt-10">Contentstack Portal</h1>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="mt-10 text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition"
                    >
                        + Notification
                    </button>

                    <Transition appear show={modalOpen} as={Fragment}>
                        <Dialog as="div" className="relative z-50" onClose={() => setModalOpen(false)}>
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
                                        <h4 className="font-bold text-2xl mb-4">Add An Alert</h4>
                                        <form onSubmit={handleSubmit} className="space-y-5">
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
                                                    onClick={() => setModalOpen(false)}
                                                    className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                                                >
                                                    Save Alert
                                                </button>
                                            </div>
                                        </form>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </Dialog>
                    </Transition>
                </div>

                <div className="flex justify-between w-full mt-4">
                    <div>
                        <div className="text-2xl font-medium my-2">Notifications</div>
                    </div>
                    <div className="flex gap-3">
                        <span>Critical Scale</span>
                        <div className="flex">
                            <div className="w-6 h-6 bg-green-500 text-white text-center">1</div>
                            <div className="w-6 h-6 bg-yellow-500 text-white text-center">2</div>
                            <div className="w-6 h-6 bg-orange-500 text-white text-center">3</div>
                            <div className="w-6 h-6 bg-red-500 text-white text-center">4</div>
                        </div>
                    </div>
                </div>

                <div className="w-full mb-24 mt-3">
                    {visibleAlerts.length ? (
                        visibleAlerts.map((note, idx) => {
                            const bgColor = getBgColor(note?.critical_value);
                            return (
                                <div
                                    key={idx}
                                    className={`relative w-full rounded-xl border ${bgColor} p-5 mb-4 transition-transform duration-1000 ease-in-out hover:scale-[1.02]`}
                                >
                                    <div className="flex items-start gap-3">
                                        <CircleAlert className="mt-1 shrink-0" />
                                        <div>
                                            <div className="font-semibold text-sm">
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
                        <div ref={ref} className="flex flex-col justify-center items-center py-8 mt-6">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">
                  {isFetchingMore ? "Loading more alerts..." : "Scroll to load more"}
                </span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                Showing {visibleAlerts.length} of {alerts.length} alerts
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}