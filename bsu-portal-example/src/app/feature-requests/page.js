"use client";
import { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { TableDemo } from "@/components/notification-table";

export default function Home() {
  const [entry, setEntry] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const getContent = async () => {
        const entry = await Stack.getElementByTypeWithRefs(
            "feature_requests",
            "en-us",
            ["header"
            ]
        );
        console.log("homepage", entry[0][0]);
        setEntry(entry[0][0]);
        setIsLoading(false);
    };

    useEffect(() => {
        onEntryChange(getContent);
    }, []);

  if(isLoading) return <div></div>

return (
    <main className="flex h-screen w-sceen overflow-hidden justify-center items-center">   
    <TableDemo content={entry?.requests}/>
    </main>

);
}