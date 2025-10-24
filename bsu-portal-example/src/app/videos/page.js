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
  const [playingIndex, setPlayingIndex] = useState(null);


  const getContent = async () => {
    try {
      const entry = await Stack.getElementByTypeWithRefs(
        "video_library",
        "en-us",
        ["videos"]
      );

      console.log("Video Library Entry:", entry[0][0]);
      setEntry(entry[0][0]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching video library content:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    onEntryChange(getContent);
  }, []);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading videos...</div>;

  return (
      <div className="pl-10 pt-6 min-h-screen flex flex-col">
          <div className="flex justify-between items-center mb-6 pt-6">
              <h1 className="text-4xl font-bold ml-4">
                  {entry?.title}
              </h1>

              <div className="flex items-center gap-2 mr-4">
                  <button
                      type="button"
                      className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition whitespace-nowrap"
                  >
                      + Videos
                  </button>

                  <div className="relative w-full max-w-sm">
                      <input
                          type="text"
                          placeholder="Search videos..."
                          className="w-full rounded-lg border text-black border-gray-300 bg-white px-4 py-2 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      />
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      >
                          <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
                          />
                      </svg>
                  </div>
              </div>
          </div>
          <div className="flex-1">
              {entry?.videos?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 me-10">
                      {entry.videos.map((video, index) => (
                          <Card
                              key={index}
                              className="h-full shadow-md hover:shadow-lg transition-all duration-200"
                          >
                              <div className="relative w-full h-60 bg-black rounded-t-lg overflow-hidden">
                                  {playingIndex === index ? (
                                      <video
                                          className="w-full h-full object-cover"
                                          controls
                                          autoPlay
                                          poster={video?.thumbnail?.url || ""}
                                      >
                                          <source src={video?.video_file?.url} type="video/mp4" />
                                          Your browser does not support the video tag.
                                      </video>
                                  ) : (
                                      <>
                                          <img
                                              src={video?.thumbnail?.url}
                                              alt={video?.title || "Video thumbnail"}
                                              className="w-full h-full object-cover cursor-pointer transition-opacity hover:opacity-80"
                                              onClick={() => setPlayingIndex(index)}
                                          />
                                          <div
                                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                              onClick={() => setPlayingIndex(index)}
                                          >
                                              <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  fill="white"
                                                  viewBox="0 0 24 24"
                                                  strokeWidth="1.5"
                                                  stroke="white"
                                                  className="w-12 h-12"
                                              >
                                                  <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      d="M8.25 4.5v15l11.25-7.5L8.25 4.5z"
                                                  />
                                              </svg>
                                          </div>
                                      </>
                                  )}
                              </div>

                              <CardHeader>
                                  <CardTitle className="truncate">{video.title}</CardTitle>
                                  {video.description && (
                                      <CardDescription className="line-clamp-2">
                                          {video.description}
                                      </CardDescription>
                                  )}
                              </CardHeader>

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
                  <p className="text-muted-foreground mt-10 text-center">
                      No videos found in the library.
                  </p>
              )}
          </div>
      </div>
  );
}
