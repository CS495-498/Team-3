import { useState, useEffect, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";

export function useInfiniteScroll(items = [], itemsPerPage = 8) {
  const [displayedItems, setDisplayedItems] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!items || items.length === 0) return;
  
    const initial = items.slice(0, itemsPerPage);
    setDisplayedItems(initial);
    setPage(1);
    setIsLoading(false);
    
  }, [items.length, itemsPerPage]);

  const hasMore = items.length > displayedItems.length;

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "0px 0px 100px 0px",
  });

  const loadMore = useCallback(() => {
    if (!hasMore) {
      return;
    }
    setIsLoading(true);
    const nextPage = page + 1;
    const endIndex = nextPage * itemsPerPage;
    const newItems = itemsRef.current.slice(0, endIndex);
    setTimeout(() => {
      setDisplayedItems(newItems);
      setPage(nextPage);
      setIsLoading(false);
  });
  }, [page, itemsPerPage, hasMore]);

  useEffect(() => {
    console.log("InfiniteScroll: effect", {
      inView,
      hasMore,
      isLoading,
      itemsLen: items.length,
      displayedLen: displayedItems.length,
      page,
    });

    if (!inView) return;
    if (isLoading) {
      return;
    }
    if (!hasMore) {
      return;
    }

    loadMore();
  }, [inView, hasMore, isLoading, loadMore, items.length, displayedItems.length, page]);

  return { items: displayedItems, hasMore, ref, isLoading };
}
