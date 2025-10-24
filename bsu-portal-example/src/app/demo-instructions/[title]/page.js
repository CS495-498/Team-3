"use client";
import { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";


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


    return (
        <div>
            hello
        </div>
    )
}