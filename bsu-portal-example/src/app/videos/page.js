"use client";
import { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { NavigationMenuDemo } from "@/components/menu"
import { Separator} from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle";
import { TableDemo } from "@/components/notification-table";
import Link from "next/link";
import Image from "next/image";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";


import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"



export default function Home() {
  const [entry, setEntry] = useState({});
	const [isLoading, setIsLoading] = useState(true);

	const getContent = async () => {
		const entry = await Stack.getElementByTypeWithRefs(
			"video_library",
			"en-us",
			["header", "videos"
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
  <div className="relative max-w-7xl mx-auto p-4">
  <SidebarProvider >
    <AppSidebar content={entry?.header?.[0]}/>
    <main className="flex h-screen">
      <SidebarTrigger />
    </main>
  <div className="flex flex-col w-full justify-center items-center"> {/* Centering the content */}
  <Card className="mx-10 my-10 w-full max-w-sm">
  <CardHeader>
    <CardTitle>{entry?.videos?.[0]?.title}</CardTitle>
    <CardDescription>{entry?.videos?.[0]?.description}</CardDescription>
  </CardHeader>
  <CardContent className="mx-auto my-auto">
    <video width="320" height="240" controls preload="none">
      <source src={entry?.videos?.[0]?.video_file?.url} type="video/mp4" />
      <track
        src={entry?.video_card?.[0]?.test_video?.video_file?.url}
        kind="subtitles"
        srcLang="en"
        label="English"
      />
      Your browser does not support the video tag.
    </video>
      
  </CardContent>
  <CardFooter>
    <p>{entry?.video_card?.[0]?.test_video?.date_posted}</p>
  </CardFooter>
  </Card>
  </div>


  </SidebarProvider>


  </div>
);
}
