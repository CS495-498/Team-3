"use client";

import { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VideoLibrary() {
  const [entry, setEntry] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch video library data from Contentstack
  const getContent = async () => {
    try {
      const entry = await Stack.getElementByTypeWithRefs(
        "video_library", // Content type UID
        "en-us",          // Locale
        ["header", "videos"] // Reference fields
      );

      console.log("Video Library Entry:", entry[0][0]);
      setEntry(entry[0][0]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching video library content:", error);
      setIsLoading(false);
    }
  };

  // Listen for real-time content updates
  useEffect(() => {
    onEntryChange(getContent);
  }, []);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading videos...</div>;

  return (
    <div className="relative max-w-7xl mx-auto p-4">
      {/* Page Content */}
      <div className="flex flex-col w-full items-start pl-[120px] pr-8">
        <h1 className="text-4xl font-bold mt-8 mb-6 text-center">
          {entry?.title || "Video Library"}
        </h1>

        {/* Videos Grid */}
        {entry?.videos?.length ? (
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full px-4">
            {entry.videos.map((video, index) => (
              <Card
                key={index}
                className="w-full max-w-[250px] mx-auto transition hover:shadow-lg hover:scale-[1.02] duration-200"
              >
                <CardHeader>
                  <CardTitle>{video.title}</CardTitle>
                  {video.description && (
                    <CardDescription>{video.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent>
                  {video?.video_file?.url ? (
                    <video
                      className="w-full rounded-md"
                      controls
                      preload="none"
                      poster={video?.thumbnail?.url || ""}
                    >
                      <source src={video.video_file.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No video file available.
                    </p>
                  )}
                </CardContent>

                <CardFooter>
                  {video.date_posted && (
                    <p className="text-xs text-muted-foreground">
                      Posted on{" "}
                      {new Date(video.date_posted).toLocaleDateString()}
                    </p>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-10">
            No videos found in the library.
          </p>
        )}
      </div>

    </div>
  );
}
