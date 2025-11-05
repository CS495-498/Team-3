"use client";
import React, {useState, useEffect, Fragment} from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import {Card, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { CircleAlert } from 'lucide-react';
import {Dialog, Transition} from '@headlessui/react'


export default function Home() {
  const [entry, setEntry] = useState({});
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const alertsPerPage = 5;

    const getContent = async () => {
        console.log("Fetching content...");
        const entry = await Stack.getElementByTypeWithRefs(
            "homepage",
            "en-us",
            ["alerts",
            ]
        );
        console.log("homepage", entry[0][0]);
        console.log("alerts", entry[0][0]?.alerts);
        setEntry(entry[0][0]);
        setIsLoading(false);
    };

    useEffect(() => {
        onEntryChange(getContent);
    }, []);

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

    const handleSubmit = (e) => {
        e.preventDefault();

        const form = e.target;
        const data = new FormData(form);

        const json = Object.fromEntries(data.entries());

        console.log("JSON to send:", JSON.stringify(json, null, 2));
    }

  let [isOpen, setIsOpen] = useState(false)

    if (isLoading) return <div></div>

    const alerts = entry?.alerts || [];

    
    // Calculate pagination
    const totalPages = Math.ceil(alerts.length / alertsPerPage);
    const startIndex = (currentPage - 1) * alertsPerPage;
    const endIndex = startIndex + alertsPerPage;
    const currentAlerts = [...alerts]
      .sort((a, b) => b.critical_value - a.critical_value)
      .slice(startIndex, endIndex);
    
    const handlePageChange = (pageNum) => {
      if (pageNum >= 1 && pageNum <= totalPages) {
        setCurrentPage(pageNum);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };


    return (
        <main className="relative w-full h-screen overflow-hidden">
            <div className="flex flex-col w-full max-w-6xl mx-auto justify-start items-start relative z-10 p-8">

                {/* Header */}
                <div className="flex flex-wrap items-start justify-between w-full mb-10">
                <h1 className="text-4xl font-bold mt-10">Contentstack Portal</h1>

                {/* Notification Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="mt-10 text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition"
                >
                    + Notification
                </button>

                {/* Modal */}
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
                                <label
                                    htmlFor="critical_value"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                                >
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

                {/* Notifications Header */}
                <div className="flex justify-between w-full mt-8">
                <div>
                    <div className="text-2xl font-medium my-2">Notifications</div>
                    <span className="font-light italic text-[13px]">
                    Displaying Notifications {startIndex + 1} -{" "}
                    {Math.min(endIndex, alerts.length)}
                    </span>
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

                {/* Notifications List */}
                <div className="w-full mb-24 mt-3">
                {currentAlerts.length ? (
                    currentAlerts.map((note, idx) => {
                    const bgColor = getBgColor(note?.critical_value);
                    return (
                        <div
                        key={idx}
                        className={`relative w-full rounded-xl border ${bgColor} p-4 mb-3 transition-transform duration-200 hover:scale-[1.02]`}
                        >
                        <div className="flex items-start gap-3">
                            <CircleAlert className="mt-1 shrink-0" />
                            <div>
                            <div className="font-semibold text-sm">
                                {note?.alert_title || "Untitled Notification"}
                            </div>
                            {note?.alert_description && (
                                <div className="text-sm opacity-90 mt-1">
                                {note.alert_description}
                                </div>
                            )}
                            </div>
                        </div>
                        </div>
                    );
                    })
                ) : (
                    <div className="text-gray-500 italic mt-3">No notifications</div>
                )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                <div
                    className="fixed bottom-6 left-[100px] right-0 flex justify-center z-20"
                    style={{ pointerEvents: "none" }}
                >
                    <nav
                    aria-label="Pagination"
                    className="pointer-events-auto bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200 px-4 py-2"
                    >
                    <ul className="flex items-center gap-2">
                        <li>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            currentPage === 1
                                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                            }`}
                        >
                            ← Prev
                        </button>
                        </li>

                        {[...Array(totalPages)].map((_, i) => (
                        <li key={i}>
                            <button
                            onClick={() => handlePageChange(i + 1)}
                            className={`w-9 h-9 rounded-full transition-all duration-200 text-sm font-medium ${
                                currentPage === i + 1
                                ? "bg-purple-600 text-white shadow-md scale-105"
                                : "bg-transparent text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                            }`}
                            >
                            {i + 1}
                            </button>
                        </li>
                        ))}

                        <li>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            currentPage === totalPages
                                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                            }`}
                        >
                            Next →
                        </button>
                        </li>
                    </ul>
                    </nav>
                </div>
                )}
            </div>
        </main>
      );
    }


