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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 w-full">
                {entry?.alerts?.length ? (
                    entry.alerts.map((note, idx) => (
                        <Card
                            key={idx}
                            className="shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 rounded-2xl"
                        >
                            <CardHeader className={`${note?.is_critical ? "text-red-600" : ""}`}>
                                <CardTitle className="text-lg font-semibold">
                                    <div className="flex gap-2 items-start">
                                        <CircleAlert className="shrink-0 mt-1" />
                                        <span>{note?.alert_title || "Untitled Notification"}</span>
                                    </div>
                                </CardTitle>
                                {note?.alert_description && (
                                    <CardDescription className="text-sm mt-1 line-clamp-3">
                                        {note.alert_description}
                                    </CardDescription>
                                )}
                            </CardHeader>
                        </Card>
                    ))
                ) : (
                    <p className="text-muted-foreground text-center col-span-full">
                        No notifications available.
                    </p>
                )}
            </div>
        </div>
    </main>
);


}
