"use client";
import { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { NavigationMenuDemo } from "@/components/menu"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle";
import { TableDemo } from "@/components/notification-table";

import Link from "next/link";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";


export default function Home() {
  const [entry, setEntry] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const getContent = async () => {
    const entry = await Stack.getElementByTypeWithRefs(
      "homepage",
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

  if (isLoading) return <div></div>

return (
  <SidebarProvider >
    <AppSidebar content={entry?.header?.[0]}/>
    <main className="flex h-screen">
      <SidebarTrigger />
      <div className="flex flex-col w-full p-4 justify-center items-center"> {/* Centering the content */}
        <div className="absolute top-3 right-3">
          <ModeToggle />
        </div>
        <h1 className="text-3xl font-bold underline mt-8">{entry?.headline}</h1>
        <div className="relative">
          <TableDemo />
        </div>
      </div>
    </main>
  </SidebarProvider>
);
}
