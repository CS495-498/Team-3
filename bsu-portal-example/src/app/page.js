"use client";
import { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { AlertDemo } from "@/components/alert";
import backGroundImage from '../../public/background.png';
import Image from "next/image";
import { Card } from "@/components/ui/card";

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
    <Image
      src={backGroundImage}
      alt="Descriptive text for screen readers"
      fill // Use fill to cover the entire parent div
      style={{ objectFit: 'cover' }} // Set object fit using style prop
      quality={100} // Specify the desired quality if using Next.js 16 or later
      className="z-0" // Adjust z-index if necessary
    />
    <div className="flex flex-col w-full max-w-screen mx-auto justify-center items-center relative z-10 h-full p-4">
      <Card className="flex flex-col p-6 mt-4 mb-4 h-full">
      <h1 className="text-3xl font-bold text-center mt-1">{entry?.headline}</h1>
      <div className="relative flex-1 overflow-hidden">
        <AlertDemo content={entry?.alerts} />
      </div>
      </Card>
    </div>
  </main>
);


}
