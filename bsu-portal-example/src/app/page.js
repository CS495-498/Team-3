"use client";
import { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { AlertDemo } from "@/components/alert";


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
  
    
    
    <main className="flex h-screen">
      <div className="flex flex-col w-full mx-10 justify-center items-center"> 
        <h1 className="text-3xl font-bold underline mt-8">{entry?.headline}</h1>
        <div className="relative">
          <AlertDemo content={entry?.alerts} />
        </div>
      </div>
    </main>
  
);

}
