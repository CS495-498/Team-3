"use client";
import React, { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import Link from "next/link";
import Image from "next/image";


import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"



export default function Demos() {
    const [entry, setEntry] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const getContent = async () => {
        const entry = await Stack.getElementByTypeWithRefs(
            "custom_demos",
            "en-us",
            ["header", "demos"
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
                        className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                    >
                        + Demos
                    </button>

                    <div className="relative w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="Search demos..."
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
                    {entry?.demos?.map((demo, idx) => (
                        <Link key={idx} target={'_blank'} href={demo?.link?.href || "#"} className="group">
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
                                    <CardDescription>{demo?.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
