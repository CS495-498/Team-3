"use client";
import React, { useState, useEffect, Fragment, useRef } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { CircleAlert } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import appendNotification from "@/app/api/helper/appendNotification.js";
import { motion, AnimatePresence } from "framer-motion";
import SuccessToast from "@/components/ui/success-toast.jsx";
import { AlertTimer, AlertCard } from "@/components/ui/alert.jsx";
import LoadingIndicator from "@/components/ui/loading-indicator.jsx";
import { useUser } from "@/context/UserContext";
import { hasPermission } from "@/utils/hasPermission";
import PERMISSIONS from "@/config/permissions";
import DOMPurify from "isomorphic-dompurify";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

export default function Home() {
    const { user } = useUser();
    const canUploadNotifications = user && hasPermission(user.role, PERMISSIONS.UPLOAD_NOTIFICATIONS);

    const [entry, setEntry] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    const expiredAlertsRef = useRef(new Set());
    const deleteTimeoutRef = useRef(null);
    const editorRef = useRef(null);

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

    const processBatchDelete = async () => {
        if (expiredAlertsRef.current.size === 0) return;

        const expiredIds = Array.from(expiredAlertsRef.current);
        expiredAlertsRef.current.clear();

        try {
            const updatedAlerts = alerts.filter(alert => {
                const alertId = alert.uid || alert._metadata?.uid;
                return !expiredIds.includes(alertId);
            });

            if (updatedAlerts.length === alerts.length) {
                console.log('No alerts to delete');
                return;
            }

            const response = await fetch("/api/update-alerts-in-cs/delete", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entryUid: entry.uid,
                    alerts: updatedAlerts,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to delete expired alerts");
            }

            const updatedEntry = await response.json();
            setEntry(updatedEntry.entry);

            console.log(`Successfully deleted ${expiredIds.length} expired alert(s)`);
        } catch (error) {
            console.error("Failed to delete expired alerts:", error);
            // Re-add failed deletions to try again later
            expiredIds.forEach(id => expiredAlertsRef.current.add(id));
        }
    };

    const handleExpiredAlert = (noteId) => {
        expiredAlertsRef.current.add(noteId);

        if (deleteTimeoutRef.current) {
            clearTimeout(deleteTimeoutRef.current);
        }


        deleteTimeoutRef.current = setTimeout(() => {
            processBatchDelete();
        }, 2000);
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

            const rawHtml = editorRef.current?.getHTML() ?? "";
            const alert_description = DOMPurify.sanitize(rawHtml);

            const newNotification = {
                alert_title: json_data.alert_title,
                alert_description,
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
                    {canUploadNotifications && (
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className="mt-10 text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition"
                        >
                            Add Notification
                        </button>
                    )}


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
                                        className="w-full max-w-2xl mx-auto"
                                        initial={{ opacity: 0, scale: 0.96, y: -8 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <Dialog.Panel className="w-full rounded-xl bg-white dark:bg-gray-700 p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
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

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                        Alert Description
                                                    </label>
                                                    <div className="w-full min-h-[300px] rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1">
                                                        <SimpleEditor html="" editorRef={editorRef} />
                                                    </div>
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
                        visibleAlerts.map((note, idx) => (
                            <AlertCard
                                key={note.uid || note._metadata?.uid || idx}
                                note={note}
                                index={idx}
                                onExpire={handleExpiredAlert}
                            />
                        ))
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