"use client";

import React, {useEffect, useState, useMemo, useCallback} from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar
} from "recharts";

import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";

import { Card, CardContent } from "@/components/ui/card";
import {format} from "date-fns";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.jsx";

export default function MetricsPage() {

    const [startDate, setStartDate] = useState(undefined);
    const [endDate, setEndDate] = useState(undefined);
    const [dateFilter, setDateFilter] = useState("Within Last 12 Hours");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [lineData, setLineData] = useState([]);
    const [crudOps, setCrudOps] = useState([]);
    const [endpointLatencyData, setEndpointLatencyData] = useState([]);

    const [loading, setLoading] = useState(false);

    const TIME_RANGE_MS = {
        "Within Last 12 Hours": 12 * 60 * 60 * 1000,
        "Within Last Day": 24 * 60 * 60 * 1000,
        "Within Last 3 Days": 3 * 24 * 60 * 60 * 1000,
        "Within Last 5 Days": 5 *24 * 60 * 60 * 1000,
        "Within Last Week": 7 * 24 * 60 * 60 * 1000,
    };
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(dateFilter);
        }, 300);

        return () => clearTimeout(timer);
    }, [dateFilter]);

    // ---------- FETCH LAYER ----------

    const fetchMetrics = useCallback(async ({ endpoint, groupBy }) => {
        const params = new URLSearchParams();
        if (groupBy) params.set("groupBy", groupBy);
        const cutoff = new Date(Date.now() - TIME_RANGE_MS[dateFilter]);
        params.set("dateFilter", cutoff.toISOString());

        const res = await fetch(`${endpoint}?${params.toString()}`);
        if (!res.ok) {
            throw new Error("Failed to fetch Metric Data");
        }
        return res.json();
        }
    );

    // ---------- DATA LOADER ----------

    useEffect(() => {

        let mounted = true;

        const loadAll = async () => {

            setLoading(true);

            const [
                userTable,
                requestsOverTime,
                endpointLatency
            ] = await Promise.all([
                fetchMetrics({
                    endpoint: "/api/metrics/user-metrics"
                }),

                fetchMetrics({
                    endpoint: "/api/metrics/api-metrics",
                    groupBy: "date"
                }),

                fetchMetrics({
                    endpoint: "/api/metrics/api-metrics",
                    groupBy: "latency_endpoint"
                })
            ]);

            if (!mounted) return;

            const sortedLineData = (requestsOverTime || [])
                .map(row => ({
                    date: row.date,
                    avg_hourly_rpm: Number(row.avg_hourly_rpm || 0),
                    error_percentage: Number(row.error_percentage || 0)
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            if (sortedLineData.length > 0 && !startDate && !endDate) {

                setStartDate(new Date(sortedLineData[0].date));
                setEndDate(new Date(sortedLineData[sortedLineData.length - 1].date));
            }

            setCrudOps(userTable || []);
            setLineData(sortedLineData);
            setEndpointLatencyData(endpointLatency || []);

            setLoading(false);
        };

        loadAll();

        return () => {
            mounted = false;
        };

    }, [startDate, endDate, dateFilter]);

    // ---------- PIE DATA ----------

    const latest = useMemo(() =>
            lineData.length > 0 ? lineData[lineData.length - 1] : {},
        [lineData]
    );

    const errorPercentage = Number(latest.error_percentage || 0);

    const pieData = [
        { name: "Error Rate", value: errorPercentage },
        {
            name: "Healthy Requests Rate",
            value: Math.max(100 - errorPercentage, 0)
        }
    ];

    const COLORS = ["#ff4d4f", "#82ca9d"];

    return (
        <div className="p-6 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">System Metrics</h1>
                    <div className="mb-6 mt-6 bg-secondary/40 p-4 rounded-lg">
                        <div className="flex flex-wrap items-center gap-6.5">

                            {/* DATE FILTER */}

                            <Select value={dateFilter || "Within Last 12 Hours"} onValueChange={(v) => setDateFilter(v)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Within Last 12 Hours" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Within Last 12 Hours">Within Last 12 Hours</SelectItem>
                                    <SelectItem value="Within Last Day">Within Last Day</SelectItem>
                                    <SelectItem value="Within Last 3 Days">Within Last 3 Days</SelectItem>
                                    <SelectItem value="Within Last 5 Days">Within Last 5 Days</SelectItem>
                                    <SelectItem value="Within Last Week">Within Last Week</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* RPM LINE CHART */}

            <Card>
                <CardContent className="pt-6">

                    <h2 className="text-lg font-semibold mb-4">
                        Overall Average Hourly RPM
                    </h2>

                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), "MM/d-HH:mm")}/>
                            <YAxis/>
                            <Tooltip
                                labelFormatter={(val) => format(new Date(val), "MMM d, HH:mm")}
                                formatter={(value, name) => [
                                    name === "avg_hourly_rpm" ? `${value.toFixed(2)} RPM` : `${value.toFixed(2)}%`,
                                    name === "avg_hourly_rpm" ? "Avg Hourly RPM" : "Error Rate"
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="avg_hourly_rpm"
                            />
                        </LineChart>
                    </ResponsiveContainer>

                </CardContent>
            </Card>

            {/* ERROR HEALTH PIE */}

            <Card>
                <CardContent className="pt-6">

                    <h2 className="text-lg font-semibold mb-4">
                        Application Health — Error Rate %
                    </h2>

                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={110}
                                label={({ name, value }) => `${name}: ${value.toFixed(2)}%`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                </CardContent>
            </Card>

            {/* LATENCY PER ENDPOINT BAR CHART */}

            <Card>
                <CardContent className="pt-6">

                    <h2 className="text-lg font-semibold mb-4">
                        Average Latency Per Endpoint (MS)
                    </h2>

                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                            layout="vertical"
                            data={endpointLatencyData}
                        >
                            <CartesianGrid strokeDasharray="3 3"/>

                            <XAxis type="number"/>
                            <YAxis
                                type="category"
                                dataKey="endpoint"
                                width={220}
                            />

                            <Tooltip/>

                                <Bar dataKey="avg_latency"/>
                            </BarChart>
                        </ResponsiveContainer>

                    </CardContent>
                </Card>

                {/* USER CRUD TABLE */}

                <Card>
                    <CardContent className="pt-6">

                        <h2 className="text-lg font-semibold mb-4">
                            User CRUD Activity
                        </h2>

                        <div className="max-h-[450px] overflow-y-auto border rounded">

                            <Table>

                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User ID</TableHead>
                                        <TableHead>Date Range</TableHead>
                                        <TableHead>POST</TableHead>
                                        <TableHead>GET</TableHead>
                                        <TableHead>PUT</TableHead>
                                        <TableHead>DELETE</TableHead>
                                        <TableHead>Total</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>

                                    {crudOps.map((row) => {

                                        const total =
                                            Number(row.total_post || 0) +
                                            Number(row.total_get || 0) +
                                            Number(row.total_put || 0) +
                                            Number(row.total_delete || 0);

                                        return (
                                            <TableRow key={`${row.user_id}-${row.start_date}`}>
                                                <TableCell>{row.user_id}</TableCell>
                                                <TableCell>
                                                    {format(new Date(row.start_date), 'MMMM dd')} → {format(new Date(row.end_date), 'MMMM dd')}

                                                </TableCell>
                                                <TableCell>{row.total_post}</TableCell>
                                                <TableCell>{row.total_get}</TableCell>
                                                <TableCell>{row.total_put}</TableCell>
                                                <TableCell>{row.total_delete}</TableCell>
                                                <TableCell className="font-bold">
                                                    {total}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
        </div>
    );
}
