"use client";
import { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";

export default  function Page({ params }){
     const [entry, setEntry] = useState({});

    

    const getContent = async () => {
         const { title } = await params;
         console.log("title", title);
        const entry = await Stack.getElementByUrlWithRefs(
            "page",
            "/pages/" + title,
            "en-us",
            [
            ]
        );
        setEntry(entry);
    };

    useEffect(() => {
        onEntryChange(getContent);
    }, []);

    console.log(entry);

    return(
        <div>
            <p>{entry?.test_field}</p>
        </div>
    )
}