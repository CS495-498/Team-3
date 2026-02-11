import { useState, useEffect, useCallback, useRef } from "react";
import { useInView } from "react-intersection-observer";

export function useServerInfiniteScroll({
    fetchFn,
    limit = 30,
    dependencies = [],
}) {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState(null);

    const isMounted = useRef(true);
    const isLoadingRef = useRef(false);

    const { ref, inView } = useInView({
        threshold: 0.25,
        rootMargin: "0px 0px 100px 0px",
    });

    // Reset when dependencies change (filters)
    useEffect(() => {
        setItems([]);
        setPage(1);
        setHasMore(true);
        setIsInitialLoad(true);
        setError(null);
    }, [...dependencies]);

    // Fetch function
    const fetchData = useCallback(
        async (pageNum) => {
            if (isLoadingRef.current) return;

            isLoadingRef.current = true;
            setIsLoading(true);
            setError(null);

            try {
                const result = await fetchFn(pageNum, limit);

                if (!isMounted.current) return;

                if (pageNum === 1) {
                    setItems(result.logs);
                } else {
                    // Deduplicate logs to prevent duplicate key errors
                    setItems((prev) => {
                        const existingIds = new Set(prev.map((item) => item.id));
                        const newItems = result.logs.filter(
                            (item) => !existingIds.has(item.id)
                        );
                        return [...prev, ...newItems];
                    });
                }

                setTotal(result.total);
                setHasMore(result.hasMore);
                setPage(pageNum);
            } catch (err) {
                if (isMounted.current) {
                    setError(err.message);
                }
            } finally {
                if (isMounted.current) {
                    setIsLoading(false);
                    setIsInitialLoad(false);
                }
                isLoadingRef.current = false;
            }
        },
        [fetchFn, limit]
    );

    // Initial load and reload on dependency change
    useEffect(() => {
        fetchData(1);
    }, [...dependencies, fetchData]);

    // Load more on scroll
    useEffect(() => {
        if (inView && hasMore && !isLoadingRef.current && !isInitialLoad) {
            fetchData(page + 1);
        }
    }, [inView, hasMore, isInitialLoad, page, fetchData]);

    // Cleanup
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const refresh = useCallback(() => {
        setItems([]);
        setPage(1);
        setHasMore(true);
        setIsInitialLoad(true);
        fetchData(1);
    }, [fetchData]);

    return {
        items,
        isLoading,
        isInitialLoad,
        hasMore,
        total,
        error,
        ref,
        refresh,
    };
}
