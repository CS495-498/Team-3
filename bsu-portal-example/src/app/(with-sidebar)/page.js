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
            case 5:
                return "bg-purple-950 text-white border-purple-400";
            case 4:
                return "bg-purple-800 text-white border-purple-400";
            case 3:
                return "bg-purple-600 text-white border-purple-400";
            case 2:
                return "bg-purple-400 text-white border-purple-400";
            case 1:
                return "bg-purple-300 text-white border-purple-200";
            default:
                return "bg-purple-500 text-white border-purple-300";
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



    return (
    <main className="relative w-full h-screen overflow-hidden">
        <div className="flex flex-col w-full max-w-6xl mx-auto justify-start items-start relative z-10 h-full p-8">

                <div className="flex flex-wrap items-start justify-between w-full mb-10">
                    <h1 className="text-4xl font-bold mt-10">Contentstack Portal</h1>

                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="mt-10 text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition"
                >
                    + Notification
                </button>
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
                                        <div className="flex items-center gap-3">
                                            <input
                                                id="isCritical"
                                                type="checkbox"
                                                name="is_critical"
                                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
                                            />
                                            <label htmlFor="isCritical" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                Is Critical
                                            </label>
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
                                                className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"                                            >
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
            <div className="flex justify-between w-full my-1">
                <div>
                    <div className="text-2xl font-medium">Notifications</div>
                    <span className="font-light italic text-[13px]">
                        Displaying Notifications 1 - 5
                    </span>
                </div>
                <div className="flex gap-3">
                    <span>Critical Scale</span>
                    <div className="flex">
                        <div className="w-6 h-6 bg-purple-300 text-white text-center">1</div>
                        <div className="w-6 h-6 bg-purple-500 text-white text-center">2</div>
                        <div className="w-6 h-6 bg-purple-700 text-white text-center">3</div>
                        <div className="w-6 h-6 bg-purple-800 text-white text-center">4</div>
                        <div className="w-6 h-6 bg-purple-950 text-white text-center">5</div>
                    </div>
                </div>
            </div>
            {entry?.alerts?.length ? (
                [...entry.alerts]
                    .sort((a, b) => b.critical_value - a.critical_value)
                    .map((note, idx) => {
                        const bgColor = getBgColor(note?.critical_value);

                        return (
                            <div
                                key={idx}
                                className={`relative w-full  rounded-xl border ${bgColor} p-4 mb-3 transition-transform duration-200 hover:scale-[1.02]`}
                            >
                                <div className="flex items-start gap-3">
                                    <CircleAlert className="mt-1 shrink-0"/>
                                    <div>
                                        <div
                                            className="font-semibold text-sm">{note?.alert_title || "Untitled Notification"}</div>
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
            <div className="flex justify-center w-full mt-3">
                <nav aria-label="Page navigation example">
                    <ul className="inline-flex -space-x-px text-sm">
                        <li>
                            <a href="#"
                               className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">Previous</a>
                        </li>
                        <li>
                            <a href="#"
                               className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">1</a>
                        </li>
                        <li>
                            <a href="#"
                               className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">2</a>
                        </li>
                        <li>
                            <a href="#" aria-current="page"
                               className="flex items-center justify-center px-3 h-8 text-purple-600 border border-gray-300 bg-purple-50 hover:bg-purple-100 hover:text-purple-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white">3</a>
                        </li>
                        <li>
                            <a href="#"
                               className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">4</a>
                        </li>
                        <li>
                            <a href="#"
                               className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">5</a>
                        </li>
                        <li>
                            <a href="#"
                               className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">Next</a>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </main>
);


}
