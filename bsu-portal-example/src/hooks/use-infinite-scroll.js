import { useState, useEffect, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";

export function useInfiniteScroll(items = [], itemsPerPage = 8, delay = 500) {
    const [displayedItems, setDisplayedItems] = useState([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [hasUserScrolled, setHasUserScrolled] = useState(false);
    const [initiallyVisible, setInitiallyVisible] = useState(false);

    const itemsRef = useRef(items);
    const sentinelRef = useRef(null);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    useEffect(() => {
        const count = items.length;
        if (count === 0) {
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

    const { ref: inViewRef, inView } = useInView({
        threshold: 0.25,
        rootMargin: "0px 0px 300px 0px",
    });

    const setRefs = useCallback(
        (node) => {
            sentinelRef.current = node;
            inViewRef(node);
        },
        [inViewRef]
    );

    useEffect(() => {
        const node = sentinelRef.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        setInitiallyVisible(Boolean(isVisible));
    }, []);

    useEffect(() => {
        const onScroll = () => {
            if (window.scrollY > 150) {
                setHasUserScrolled(true);
                window.removeEventListener("scroll", onScroll);
            }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        if (window.scrollY > 150) {
            setHasUserScrolled(true);
            window.removeEventListener("scroll", onScroll);
        }
        return () => window.removeEventListener("scroll", onScroll);
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
        if (!inView) return;
        if (isLoading) return;
        if (!hasMore) return;
        if (!hasUserScrolled && initiallyVisible) return;
        loadMore();
    }, [inView, isLoading, hasMore, hasUserScrolled, initiallyVisible, loadMore]);

    return { items: displayedItems, hasMore, ref: setRefs, isLoading };
}
