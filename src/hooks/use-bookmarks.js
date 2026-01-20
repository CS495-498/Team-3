"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/Supabase/client.js";

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
  const supabase = useMemo(() => createClient(), []);
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [pendingMap, setPendingMap] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadBookmarks = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (userError || !user) {
          setUserId(null);
          setBookmarks([]);
          setIsLoading(false);
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from("bookmarks")
          .select("*")
          .eq("user_id", user.id)
          .eq("resource_type", resourceType)
          .order("created_at", { ascending: false });

        if (!isMounted) return;

        if (error) {
          console.error("Failed to fetch bookmarks:", error);
          setBookmarks([]);
        } else {
          setBookmarks(data || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Unexpected bookmark fetch error:", err);
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
  }, [resourceType, supabase]);

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
    async (resourceId, metadata = {}) => {
      if (!resourceId) {
        return { error: "MISSING_RESOURCE_ID" };
      }
      if (!userId) {
        return { error: "AUTH_REQUIRED" };
      }

      const currentlyBookmarked = isBookmarked(resourceId);
      setPending(resourceId, true);

      try {
        if (currentlyBookmarked) {
          const { error } = await supabase
            .from("bookmarks")
            .delete()
            .match({
              user_id: userId,
              resource_type: resourceType,
              resource_id: resourceId,
            });

          if (error) {
            console.error("Failed to remove bookmark:", error);
            return { error: "REQUEST_FAILED" };
          }

          setBookmarks((prev) =>
            prev.filter((bookmark) => bookmark.resource_id !== resourceId),
          );
          return { bookmarked: false };
        }

        const payload = {
          user_id: userId,
          resource_type: resourceType,
          resource_id: resourceId,
          resource_title: metadata.title || null,
          resource_description: metadata.description || null,
          resource_url: metadata.url || null,
          resource_thumbnail: metadata.thumbnail || null,
          metadata: metadata.extra || null,
        };

        const { data, error } = await supabase
          .from("bookmarks")
          .insert(payload)
          .select()
          .single();

        if (error) {
          console.error("Failed to create bookmark:", error);
          return { error: "REQUEST_FAILED" };
        }

        setBookmarks((prev) => [...prev, data]);
        return { bookmarked: true };
      } catch (err) {
        console.error("Unexpected toggle bookmark error:", err);
        return { error: "REQUEST_FAILED" };
      } finally {
        setPending(resourceId, false);
      }
    },
    [isBookmarked, resourceType, setPending, supabase, userId],
  );

  return {
    bookmarks,
    isAuthenticated: Boolean(userId),
    isLoading,
    isBookmarked,
    toggleBookmark,
    isPending: (resourceId) => Boolean(resourceId && pendingMap[resourceId]),
  };
}
