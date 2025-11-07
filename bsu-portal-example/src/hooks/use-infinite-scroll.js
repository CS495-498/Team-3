import { useState, useEffect, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";

export function useInfiniteScroll(items = [], itemsPerPage = 8, delay = 300) {
    const [displayedItems, setDisplayedItems] = useState([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [hasUserScrolled, setHasUserScrolled] = useState(false);
    const itemsRef = useRef(items);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    useEffect(() => {
        const itemCount = items.length;
        if (itemCount === 0) {
            setDisplayedItems([]);
            setPage(1);
            setIsLoading(false);
            return;
        }
        const initial = items.slice(0, itemsPerPage);
        setDisplayedItems(initial);
        setPage(1);
        setIsLoading(false);
    }, [items.length, itemsPerPage]);

    const hasMore = items.length > displayedItems.length;

    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: "0px 0px 50px 0px",
    });

    useEffect(() => {
        const handleScroll = () => setHasUserScrolled(true);
        window.addEventListener("scroll", handleScroll, { once: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const loadMore = useCallback(() => {
        if (!hasMore || isLoading) return;
        setIsLoading(true);
        const nextPage = page + 1;
        const endIndex = nextPage * itemsPerPage;
        const newItems = itemsRef.current.slice(0, endIndex);
        const timer = setTimeout(() => {
            setDisplayedItems(newItems);
            setPage(nextPage);
            setIsLoading(false);
        }, delay);
        return () => clearTimeout(timer);
    }, [page, itemsPerPage, hasMore, isLoading, delay]);

    useEffect(() => {
        if (!hasUserScrolled) return;
        if (!inView || isLoading || !hasMore) return;
        loadMore();
    }, [inView, hasMore, isLoading, loadMore, hasUserScrolled]);

    return { items: displayedItems, hasMore, ref, isLoading };
}
