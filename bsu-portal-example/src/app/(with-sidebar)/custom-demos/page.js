"use client";
import React, {useState, useEffect, Fragment} from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import Link from "next/link";
import Image from "next/image";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";


import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {Dialog, Transition} from "@headlessui/react";



export default function Demos() {
    const [entry, setEntry] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const getContent = async () => {
        const entry = await Stack.getElementByTypeWithRefs(
            "custom_demos",
            "en-us",
            ["demos"
            ]
        );
        console.log("CMS Entry:", entry);
        console.log("Demo:", entry);

        setEntry(entry[0][0]);
        setIsLoading(false);
    };

    useEffect(() => {
        onEntryChange(getContent);
    }, []);

    const demos = entry?.demos?.filter((demo) => {
        const query = searchQuery.toLowerCase();
        return (
            demo.title?.toLowerCase().includes(query) ||
            demo.description?.toLowerCase().includes(query)
        );
    }) || [];
    const { items: visibleDemos, hasMore, ref } = useInfiniteScroll(demos, 8);

    const handleSubmit = (e) => {
        e.preventDefault();

        const form = e.target;
        const data = new FormData(form);

        const json = Object.fromEntries(data.entries());

        if (data.get("image")) {
            json.thumbnailFile = data.get("image").name;
        }

        console.log("JSON to send:", JSON.stringify(json, null, 2));
    }

    let [isOpen, setIsOpen] = useState(false)


    if(isLoading) return <div></div>

    return (
        <div className="pl-10 pt-6 min-h-screen flex flex-col">
            <div className="flex justify-between items-center mb-6 pt-6">
                <h1 className="text-4xl font-bold ml-4">
                    {entry?.title}
                </h1>
                <div className="flex items-center gap-2 mr-4">
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
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
                                        <h4 className="font-bold text-2xl mb-4">Add A Demo</h4>
                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    Title
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter video title"
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    Demo Description
                                                </label>
                                                <textarea
                                                    rows="3"
                                                    placeholder="Describe the video..."
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                                                ></textarea>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    Link
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter Demo URL"
                                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    Image
                                                </label>
                                                <input
                                                    type="file"
                                                    name="image"
                                                    accept="image/*"
                                                    className="w-full text-sm text-gray-700 dark:text-gray-200
                                                             file:mr-4 file:py-2 file:px-4
                                                             file:rounded-lg file:border-0
                                                             file:text-sm file:font-medium
                                                             file:bg-gray-400 file:text-white
                                                             hover:file:bg-gray-500
                                                             bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                                                             rounded-lg px-2 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500
                                                             outline-none transition"
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
                                                    Save Demo
                                                </button>
                                            </div>
                                        </form>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </Dialog>
                    </Transition>
                </div>
            </div>
            <div className="flex-1">
                {visibleDemos.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 me-10">
                            {visibleDemos.map((demo, idx) => (
                                <Link key={idx} target={'_blank'} href={demo?.link?.href || "#"} className="group">
                                    <Card className="h-[340px] flex flex-col shadow-md hover:shadow-lg transition-shadow duration-200">
                                        {demo?.image?.url && (
                                            <div className="relative w-full h-[250px]">
                                            <Image
                                                src={demo.image.url}
                                                alt={demo.title || "Demo image"}
                                                fill
                                                className="object-cover rounded-t-lg group-hover:opacity-90 transition-opacity"
                                            />
                                            </div>
                                        )}
                                        <CardHeader className="flex-grow flex flex-col justify-between">
                                            <div>
                                            <CardTitle className="text-lg font-semibold">{demo?.title}</CardTitle>
                                            <CardDescription className="line-clamp-3 text-gray-600 dark:text-gray-300">
                                                {demo?.description}
                                            </CardDescription>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                        {hasMore && (
                            <div ref={ref} className="flex flex-col justify-center items-center py-8 mt-6">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">{isLoading ? "Loading more demos..." : "Loading more demos..."}</span>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                Showing {visibleDemos.length} of {demos.length} demos
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                </p>
                            </div>
                            )}
                    </>
                ) : (
                    <div className="flex items-center justify-center py-12 mt-6">
                        <p className="text-gray-500 dark:text-gray-400">No demos found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
