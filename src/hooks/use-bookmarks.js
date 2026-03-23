"use client";

import { useCallback, useEffect, useState } from "react";

export const BOOKMARK_TYPES = {
  DEMO_WEBSITE: "demo_website",
  VIDEO: "video",
  DEMO_INSTRUCTION: "demo_instruction",
};

/**
 * Reusable hook for loading and toggling bookmarks for the authenticated user.
 * Keeps the UI in sync while requests are in-flight and surfaces lightweight errors.
 */
export function useBookmarks(resourceType) {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingMap, setPendingMap] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadBookmarks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/bookmarks?resourceType=${encodeURIComponent(resourceType)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!isMounted) return;

        if (response.status === 401) {
          setIsAuthenticated(false);
          setBookmarks([]);
          return;
        }

        if (!response.ok) {
          console.error("Failed to fetch bookmarks:", response.status);
          setIsAuthenticated(true);
          setBookmarks([]);
          return;
        }

        const data = await response.json();
        setIsAuthenticated(true);
        setBookmarks(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) {
          console.error("Unexpected bookmark fetch error:", err);
          setIsAuthenticated(false);
          setBookmarks([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadBookmarks();

    return () => {
      isMounted = false;
    };
  }, [resourceType]);

  const isBookmarked = useCallback(
    (resourceId) =>
      Boolean(resourceId) &&
      bookmarks.some((bookmark) => bookmark.resource_id === resourceId),
    [bookmarks],
  );

  const setPending = useCallback((resourceId, value) => {
    setPendingMap((prev) => {
      const next = { ...prev };
      if (!resourceId) return next;
      if (value) {
        next[resourceId] = true;
      } else {
        delete next[resourceId];
      }
      return next;
    });
  }, []);

  const toggleBookmark = useCallback(
    async (resourceId) => {
      if (!resourceId) {
        return { error: "MISSING_RESOURCE_ID" };
      }
      if (!isAuthenticated) {
        return { error: "AUTH_REQUIRED" };
      }

      const currentlyBookmarked = isBookmarked(resourceId);
      setPending(resourceId, true);

      try {
        if (currentlyBookmarked) {
          const response = await fetch("/api/bookmarks", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              resourceType,
              resourceId,
            }),
          });

          if (response.status === 401) {
            setIsAuthenticated(false);
            setBookmarks([]);
            return { error: "AUTH_REQUIRED" };
          }

          if (!response.ok) {
            console.error("Failed to remove bookmark:", response.status);
            return { error: "REQUEST_FAILED" };
          }

          setBookmarks((prev) =>
            prev.filter((bookmark) => bookmark.resource_id !== resourceId),
          );
          return { bookmarked: false };
        }

        const response = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resourceType,
            resourceId,
          }),
        });

        if (response.status === 401) {
          setIsAuthenticated(false);
          setBookmarks([]);
          return { error: "AUTH_REQUIRED" };
        }

        if (!response.ok) {
          console.error("Failed to create bookmark:", response.status);
          return { error: "REQUEST_FAILED" };
        }

        const data = await response.json();
        setBookmarks((prev) => [...prev, data]);
        return { bookmarked: true };
      } catch (err) {
        console.error("Unexpected toggle bookmark error:", err);
        return { error: "REQUEST_FAILED" };
      } finally {
        setPending(resourceId, false);
      }
    },
    [isAuthenticated, isBookmarked, resourceType, setPending],
  );

  return {
    bookmarks,
    isAuthenticated,
    isLoading,
    isBookmarked,
    toggleBookmark,
    isPending: (resourceId) => Boolean(resourceId && pendingMap[resourceId]),
  };
}
