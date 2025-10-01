"use client";
import { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { NavigationMenuDemo } from "@/components/menu"
import { Separator} from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle";
import { TableDemo } from "@/components/notification-table";
import Link from "next/link";
import Image from "next/image";

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
			["header", "video_card"
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
    <div className="absolute top-3 left-3">
      <img className="w-30 h-10" src={entry?.header?.[0]?.logo?.url} />
    </div>
	<div className="absolute top-3 right-3">
		<ModeToggle/>
    </div>
    <div className="mt-8 flex flex-col items-center">
        <nav>
          {entry?.header?.[0]?.navigation_menu?.map((item) => (
            <Link
              key={item.call_to_action.href}
              href={item.call_to_action.href}
              className="px-3 py-1 hover:text-blue-500"
            >
              {item.label}
            </Link>
          ))}
        </nav>
    </div>

	<Separator/>



  <Card className="mx-10 my-10 w-full max-w-sm">
    
  <CardHeader>
    <CardTitle>{entry?.video_card?.[0]?.test_video?.video_title}</CardTitle>
    <CardDescription>{entry?.video_card?.[0]?.test_video?.video_description}</CardDescription>
  </CardHeader>
  <CardContent className="mx-auto my-auto">
    <video width="320" height="240" controls preload="none">
      <source src={entry?.video_card?.[0]?.test_video?.video_file?.url} type="video/mp4" />
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
);
}
