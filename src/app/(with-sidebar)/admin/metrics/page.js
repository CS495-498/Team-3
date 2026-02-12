"use client";

import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
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

export default function MetricsPage() {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const [lineData, setLineData] = useState([]);
    const [endpointData, setEndpointData] = useState([]);
    const [methodData, setMethodData] = useState([]);
    const [crudOps, setCrudOps] = useState([]);

    const [loading, setLoading] = useState(false);

    // ---------- FETCH LAYER ----------
    const fetchMetrics = async ({ endpoint, groupBy }) => {
        const params = new URLSearchParams();

        if (startDate) params.set("start_date", startDate.toISOString());
        if (endDate) params.set("end_date", endDate.toISOString());
        if (groupBy) params.set("groupBy", groupBy);

        const res = await fetch(`${endpoint}?${params.toString()}`);
        return res.json();
    };

    // ---------- LOAD ALL VISUALS ----------
    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);

            const [
                userTable,
                requestsOverTime,
                endpointUsage,
                methodDist,
            ] = await Promise.all([
                fetchMetrics({ endpoint: "/api/metrics/user-metrics", groupBy: "user_week" }),
                fetchMetrics({ endpoint: "/api/metrics/api-metrics", groupBy: "date" }),
                fetchMetrics({ endpoint: "/api/metrics/api-metrics", groupBy: "endpoint" }),
                fetchMetrics({ endpoint: "/api/metrics/api-metrics", groupBy: "methods" }),
            ]);

            // After fetching lineData
            const sortedLineData = requestsOverTime
                .map(row => ({ ...row, date: row.date })) // ensure date is string
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            setCrudOps(userTable);
            setLineData(sortedLineData);
            setEndpointData(endpointUsage);
            setMethodData(methodDist);

            setLoading(false);
        };

        loadAll();
    }, [startDate, endDate]);

    // ---------- PIE TRANSFORM ----------
    const pieData = [
        {
            name: "POST",
            value: methodData.reduce((sum, d) => sum + (d.total_post || 0), 0),
        },
        {
            name: "GET",
            value: methodData.reduce((sum, d) => sum + (d.total_get || 0), 0),
        },
        {
            name: "PUT",
            value: methodData.reduce((sum, d) => sum + (d.total_put || 0), 0),
        },
        {
            name: "DELETE",
            value: methodData.reduce((sum, d) => sum + (d.total_delete || 0), 0),
        },
    ];

    const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

    return (
        <div className="p-6 space-y-8">

            {/* ---------- CHARTS SECTION ---------- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LINE CHART */}
                <Card>
                    <CardContent className="pt-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Requests Over Time
                        </h2>

                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={lineData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="total_requests" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* ENDPOINT BAR */}
                <Card>
                    <CardContent className="pt-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Most Used Endpoints
                        </h2>

                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart layout="vertical" data={endpointData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="endpoint" width={200} interval={0}/>
                                <Tooltip />
                                <Bar dataKey="total_requests" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* PIE */}
                <Card>
                    <CardContent className="pt-6">
                        <h2 className="text-lg font-semibold mb-4">
                            HTTP Method Distribution
                        </h2>

                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={110}
                                    label
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* ---------- SCROLL TABLE ---------- */}
            <Card>
                <CardContent className="pt-6">
                    <h2 className="text-lg font-semibold mb-4">
                        Weekly User CRUD Activity
                    </h2>

                    <div className="max-h-[450px] overflow-y-auto border rounded">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Date Range</TableHead>
                                    <TableHead>POST</TableHead>
                                    <TableHead>GET</TableHead>
                                    <TableHead>PUT</TableHead>
                                    <TableHead>DELETE</TableHead>
                                    <TableHead>Total</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {crudOps.map((row) => (
                                    <TableRow key={row.user_id}>
                                        <TableCell>{row.user_id}</TableCell>
                                        <TableCell>{row.start_date} → {row.end_date}</TableCell>
                                        <TableCell>{row.total_post}</TableCell>
                                        <TableCell>{row.total_get}</TableCell>
                                        <TableCell>{row.total_put}</TableCell>
                                        <TableCell>{row.total_delete}</TableCell>
                                        <TableCell className="font-bold">{row.total_requests}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {crudOps.length === 0 && !loading && (
                        <div className="text-center text-muted-foreground mt-4">
                            No data available
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}