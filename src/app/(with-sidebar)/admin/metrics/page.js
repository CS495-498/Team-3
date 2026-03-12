"use client";

import { useEffect, useState, useMemo } from "react";
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

export default function MetricsPage() {

    const [startDate, setStartDate] = useState(undefined);
    const [endDate, setEndDate] = useState(undefined);

    const [lineData, setLineData] = useState([]);
    const [crudOps, setCrudOps] = useState([]);
    const [endpointLatencyData, setEndpointLatencyData] = useState([]);

    const [loading, setLoading] = useState(false);

    // ---------- FETCH LAYER ----------

    const fetchMetrics = async ({ endpoint, groupBy }) => {

        const params = new URLSearchParams();

        if (startDate instanceof Date && !isNaN(startDate))
            params.set("start_date", startDate.toISOString());

        if (endDate instanceof Date && !isNaN(endDate))
            params.set("end_date", endDate.toISOString());

        if (groupBy)
            params.set("groupBy", groupBy);

        const res = await fetch(`${endpoint}?${params.toString()}`);
        return res.json();
    };

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

    }, [startDate, endDate]);

    // ---------- PIE DATA ----------

    const latest = useMemo(() =>
            lineData.length > 0 ? lineData[lineData.length - 1] : {},
        [lineData]
    );

    const errorPercentage = Math.round(Number(latest.error_percentage || 0));

    const pieData = [
        { name: "Errors", value: errorPercentage },
        {
            name: "Healthy Requests",
            value: Math.max(100 - errorPercentage, 0)
        }
    ];

    const COLORS = ["#ff4d4f", "#82ca9d"];

    return (
        <div className="p-6 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">System Metrics</h1>
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

                            <Tooltip
                                formatter={(value) => [`${value.toFixed(2)}%`, "Error Rate"]}
                            />
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