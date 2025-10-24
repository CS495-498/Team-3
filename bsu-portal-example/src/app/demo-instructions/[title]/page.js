"use client";
import { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import DOMPurify from "isomorphic-dompurify";


export default function Page({ params }) {
    const [entry, setEntry] = useState({});

    const getContent = async () => {
        const { title } = await params;
        console.log("title", title);
        const entry = await Stack.getElementByUrlWithRefs(
            "demo_instruction",
            "/demo-instructions/" + title,
            "en-us",
            [
            ]
        );
        setEntry(entry);
        console.log(entry);
    };

    useEffect(() => {
        onEntryChange(getContent);
    }, []);

const safeHTML = DOMPurify.sanitize(entry?.blog_content || "<p>No content available</p>");
return (
    <div className="flex flex-col min-h-screen">
        <div className="p-6 flex-grow"> {/* Adjust the padding here if needed */}
            <div 
                className="rich-text"
                dangerouslySetInnerHTML={{ __html: safeHTML }}
            />
        </div>
    </div>
);


}