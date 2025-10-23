"use client";
import React, { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { AlertDemo } from "@/components/alert";
import backGroundImage from '../../public/background.png';
import Image from "next/image";
import {Card, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { CircleAlert } from 'lucide-react';


export default function Home() {
  const [entry, setEntry] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const getContent = async () => {
    console.log("Fetching content...");
    const entry = await Stack.getElementByTypeWithRefs(
      "homepage",
      "en-us",
      ["header","alerts",
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


  if (isLoading) return <div></div>


return (
    <main className="relative w-full h-screen overflow-hidden">
        <div className="flex flex-col w-full max-w-6xl mx-auto justify-start items-start relative z-10 h-full p-8">

            <div className="relative w-full mb-10">
                <h1 className="text-4xl font-bold mt-10">Contentstack Portal</h1>

                <button
                    type="button"
                    className="absolute top-10 right-0 text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition"
                >
                    + Notification
                </button>
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
