import { NextResponse } from "next/server";
import PERMISSIONS from "@/config/permissions.js";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission.js";

export async function GET(request) {
    try {

        const { error: authError, supabase } =
            await requireAuthWithPermission(
                PERMISSIONS.VIEW_METRICS
            );

        if (authError) return authError;

        const { searchParams } = new URL(request.url);

        const dateFilter = searchParams.get("dateFilter");
        const groupBy = searchParams.get("groupBy");

        let query = supabase
            .from("daily_api_metrics")
            .select(`
                date,
                endpoint,
                avg_request_rate,
                avg_latency,
                post_count,
                get_count,
                put_count,
                delete_count,
                error_rate
            `);


        query = query.gte("date", dateFilter);

        const { data, error } = await query;

        if (error) throw error;

        // =====================================================
        // RPM OVER TIME
        // =====================================================

        if (groupBy === "date") {

            const grouped = {};

            (data || []).forEach(row => {

                if (!row.date) return;

                const bucket = new Date(row.date).toISOString().slice(0, 13) + ":00:00.000Z";

                const requestCount =
                    Number(row.post_count || 0) +
                    Number(row.get_count || 0) +
                    Number(row.put_count || 0) +
                    Number(row.delete_count || 0);

                if (!grouped[bucket]) {
                    grouped[bucket] = {
                        date: bucket,
                        total_requests: 0,
                        weighted_rpm: 0,
                        weighted_error: 0
                    };
                }

                grouped[bucket].total_requests += requestCount;

                grouped[bucket].weighted_rpm += Number(row.avg_request_rate || 0) * requestCount;

                grouped[bucket].weighted_error += Number(row.error_rate || 0) * requestCount;
            });

            const result = Object.values(grouped)
                .map(row => {

                    const rpm =
                        row.total_requests > 0
                            ? row.weighted_rpm / row.total_requests
                            : 0;

                    const errorPercentage =
                        row.total_requests > 0
                            ? row.weighted_error / row.total_requests
                            : 0;

                    return {
                        date: row.date,
                        avg_hourly_rpm: rpm,
                        error_percentage: errorPercentage
                    };
                })
                .sort((a, b) =>
                    new Date(a.date) - new Date(b.date)
                );

            return NextResponse.json(result);
        }

        // =====================================================
        // EXISTING LATENCY LOGIC (UNCHANGED)
        // =====================================================

        const grouped = {};

        (data || []).forEach(row => {

            const requestCount =
                Number(row.post_count || 0) +
                Number(row.get_count || 0) +
                Number(row.put_count || 0) +
                Number(row.delete_count || 0);

            if (!grouped[row.endpoint]) {
                grouped[row.endpoint] = {
                    endpoint: row.endpoint,
                    total_latency_weighted: 0,
                    total_requests: 0
                };
            }

            grouped[row.endpoint].total_latency_weighted += Number(row.avg_latency || 0) * requestCount;

            grouped[row.endpoint].total_requests += requestCount;
        });

        const result = Object.values(grouped).map(row => ({
            endpoint: row.endpoint,
            avg_latency: row.total_requests > 0
                ? Math.round(row.total_latency_weighted / row.total_requests * 100) / 100
                : 0
        }));

        return NextResponse.json(
            result.sort((a, b) => b.avg_latency - a.avg_latency)
        );

    } catch (err) {

        console.error(err);

        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}