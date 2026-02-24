"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useServerInfiniteScroll } from "@/hooks/use-server-infinite-scroll";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Search,
    ChevronDown,
    ChevronRight,
    RefreshCw,
    Activity,
} from "lucide-react";

// Time range filter presets (in milliseconds)
const TIME_RANGE_MS = {
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
};

// HTTP method badge colors
const getMethodBadgeClass = (method) => {
    const colors = {
        GET: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
        POST: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
        PUT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
        PATCH: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
        DELETE: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    };
    return colors[method] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
};

// Status code colors
const getStatusCodeClass = (code) => {
    if (code >= 200 && code < 300) {
        return "text-green-600 dark:text-green-400";
    } else if (code >= 400 && code < 500) {
        return "text-yellow-600 dark:text-yellow-400";
    } else if (code >= 500) {
        return "text-red-600 dark:text-red-400";
    }
    return "text-gray-600 dark:text-gray-400";
};

// Format timestamp to readable format
const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

// Loading skeleton component
function LogTableSkeleton() {
    return (
        <div className="p-4 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[140px]" />
                    <Skeleton className="h-6 w-[60px]" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-[50px]" />
                    <Skeleton className="h-4 w-[60px]" />
                    <Skeleton className="h-4 w-[100px]" />
                </div>
            ))}
        </div>
    );
}

// Expandable log row component
function LogRow({ log, isExpanded, onToggle }) {
    const method = log.metadata?.method || "N/A";
    const processingTime = log.metadata?.processing_time_ms;

    return (
        <>
            <TableRow
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={onToggle}
            >
                <TableCell className="w-[40px]">
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                </TableCell>
                <TableCell className="font-mono text-xs whitespace-nowrap">
                    {formatTimestamp(log.timestamp)}
                </TableCell>
                <TableCell>
                    <span
                        className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            getMethodBadgeClass(method)
                        )}
                    >
                        {method}
                    </span>
                </TableCell>
                <TableCell className="font-mono text-sm max-w-[300px] truncate">
                    {log.endpoint}
                </TableCell>
                <TableCell>
                    <span
                        className={cn(
                            "font-mono font-medium",
                            getStatusCodeClass(log.status_code)
                        )}
                    >
                        {log.status_code}
                    </span>
                </TableCell>
                <TableCell className="font-mono text-sm">
                    {processingTime != null ? `${processingTime}ms` : "—"}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                    {log.user_id ? log.user_id.slice(0, 8) + "..." : "Anonymous"}
                </TableCell>
            </TableRow>

            {/* Expanded details */}
            {isExpanded && (
                <TableRow className="bg-muted/30">
                    <TableCell colSpan={7} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-muted-foreground">
                                    Level:
                                </span>
                                <span className="ml-2 capitalize">{log.level}</span>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">
                                    Full User ID:
                                </span>
                                <span className="ml-2 font-mono text-xs">
                                    {log.user_id || "Anonymous"}
                                </span>
                            </div>
                            <div className="md:col-span-2">
                                <span className="font-medium text-muted-foreground">
                                    Message:
                                </span>
                                <span className="ml-2">{log.message}</span>
                            </div>
                            {log.metadata && (
                                <>
                                    <div className="md:col-span-2">
                                        <span className="font-medium text-muted-foreground">
                                            User Agent:
                                        </span>
                                        <span className="ml-2 text-xs break-all">
                                            {log.metadata.user_agent || "N/A"}
                                        </span>
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className="font-medium text-muted-foreground">
                                            Referer:
                                        </span>
                                        <span className="ml-2 text-xs">
                                            {log.metadata.referer || "N/A"}
                                        </span>
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className="font-medium text-muted-foreground">
                                            Full Metadata:
                                        </span>
                                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                            {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                    </div>
                                </>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}

export default function LogsPage() {
    // Filter state
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [methodFilter, setMethodFilter] = useState("");
    const [timeFilter, setTimeFilter] = useState("");

    // Expandable row state
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Debounce search input (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput]);

    // Fetch function for the hook
    const fetchLogs = useCallback(
        async (page, limit) => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (debouncedSearch) params.set("search", debouncedSearch);
            if (levelFilter) params.set("level", levelFilter);
            if (statusFilter) params.set("status", statusFilter);
            if (methodFilter) params.set("method", methodFilter);
            if (timeFilter && TIME_RANGE_MS[timeFilter]) {
                const cutoff = new Date(Date.now() - TIME_RANGE_MS[timeFilter]);
                params.set("timestamp", cutoff.toISOString());
            }

            const response = await fetch(`/api/logs/dashboard?${params.toString()}`);
            if (!response.ok) {
                throw new Error("Failed to fetch logs");
            }
            return response.json();
        },
        [debouncedSearch, levelFilter, statusFilter, methodFilter, timeFilter]
    );

    const {
        items: logs,
        isLoading,
        isInitialLoad,
        hasMore,
        total,
        error,
        ref: sentinelRef,
        refresh,
    } = useServerInfiniteScroll({
        fetchFn: fetchLogs,
        limit: 30,
        dependencies: [debouncedSearch, levelFilter, statusFilter, methodFilter, timeFilter],
    });

    // Toggle row expansion
    const toggleRow = (id) => {
        setExpandedRows((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchInput("");
        setDebouncedSearch("");
        setLevelFilter("");
        setStatusFilter("");
        setMethodFilter("");
        setTimeFilter("");
    };

    const hasActiveFilters =
        searchInput || levelFilter || statusFilter || methodFilter || timeFilter;

    return (
        <div className="p-6 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">System Logs</h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-lg">
                        <Activity className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {total.toLocaleString()} total logs
                        </span>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    disabled={isLoading}
                >
                    <RefreshCw
                        className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")}
                    />
                    Refresh
                </Button>
            </div>

            {/* Filter Bar */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search endpoints or messages..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Level Filter */}
                        <Select value={levelFilter || "all"} onValueChange={(v) => setLevelFilter(v === "all" ? "" : v)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="info">Info</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="error">Error</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="2xx">2xx Success</SelectItem>
                                <SelectItem value="4xx">4xx Client Error</SelectItem>
                                <SelectItem value="5xx">5xx Server Error</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Method Filter */}
                        <Select value={methodFilter || "all"} onValueChange={(v) => setMethodFilter(v === "all" ? "" : v)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Methods</SelectItem>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="PATCH">PATCH</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Time Range Filter */}
                        <Select value={timeFilter || "all"} onValueChange={(v) => setTimeFilter(v === "all" ? "" : v)}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Time Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="15m">Last 15 minutes</SelectItem>
                                <SelectItem value="1h">Last 1 hour</SelectItem>
                                <SelectItem value="6h">Last 6 hours</SelectItem>
                                <SelectItem value="24h">Last 24 hours</SelectItem>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                Clear filters
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardContent className="p-0">
                    {isInitialLoad ? (
                        <LogTableSkeleton />
                    ) : error ? (
                        <div className="p-6 text-center text-red-500">
                            Error: {error}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                            No logs found matching your filters.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40px]"></TableHead>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Endpoint</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>User ID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <LogRow
                                            key={log.id}
                                            log={log}
                                            isExpanded={expandedRows.has(log.id)}
                                            onToggle={() => toggleRow(log.id)}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Infinite scroll sentinel */}
                    {hasMore && !isInitialLoad && (
                        <div ref={sentinelRef} className="p-4 text-center">
                            {isLoading && (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm text-muted-foreground">
                                        Loading more logs...
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* End of list indicator */}
                    {!hasMore && logs.length > 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            All {total.toLocaleString()} logs loaded
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
