"use client";
import { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { NavigationMenuDemo } from "@/components/menu"
import { ModeToggle } from "@/components/mode-toggle";

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
            <div className="absolute top-3 right-3">
                <ModeToggle/>
            </div>
            <div className="relative max-w-7xl mx-auto p-4 flex flex-col items-center">
              <NavigationMenuDemo />
            </div>            
            <p>{entry?.test_field}</p>
        </div>
    )
}