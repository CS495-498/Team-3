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

  if (isLoading) return <div></div>


return (
    <main className="relative w-full h-screen overflow-hidden">
        <div className="flex flex-col w-full max-w-6xl mx-auto justify-start items-start relative z-10 h-full p-8">

            <div className="flex flex-wrap items-start justify-between w-full mb-10">
                <h1 className="text-4xl font-bold mt-10">Contentstack Portal</h1>

                <button
                    type="button"
                    className="mt-10 text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition"
                >
                    + Notification
                </button>
            </div>
            <div className="flex justify-between w-full my-8">
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
                                className={`relative w-full overflow-hidden rounded-xl border ${bgColor} p-4 mb-3 transition-transform duration-200 hover:scale-[1.02]`}
                            >
                                <div className="flex items-start gap-3">
                                    <CircleAlert className="mt-1 shrink-0"/>
                                    <div>
                                        <div
                                            className="font-semibold text-lg">{note?.alert_title || "Untitled Notification"}</div>
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
