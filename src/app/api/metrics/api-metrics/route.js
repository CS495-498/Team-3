import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";

export async function GET(request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("start_date");
        const endDate = searchParams.get("end_date");
        const groupBy = searchParams.get("groupBy");

        let query = supabase.from("daily_api_metrics").select("*");

        if (startDate) {
            const [startMonth, startDay] = startDate.split("-").map(Number);
            query = query.filter(
                "date",
                "gte",
                new Date(2000, startMonth - 1, startDay).toISOString() // dummy year
            );
        }

        if (endDate) {
            const [endMonth, endDay] = endDate.split("-").map(Number);
            query = query.filter(
                "date",
                "lte",
                new Date(2000, endMonth - 1, endDay).toISOString()
            );
        }

        const { data, error } = await query;

        if (error) {
            console.error(error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const grouped = {};

        if (groupBy === "date") {
            (data || []).forEach(row => {
                if (!grouped[row.date]) grouped[row.date] = { date: row.date, total_requests: 0 };
                grouped[row.date].total_requests += Number(row.request_count);
            });
            return NextResponse.json(Object.values(grouped));
        }

        if (groupBy === "endpoint") {
            const grouped = {};

            (data || []).forEach(row => {
                if (!grouped[row.endpoint]) grouped[row.endpoint] = { endpoint: row.endpoint, total_requests: 0 };
                grouped[row.endpoint].total_requests += Number(row.request_count);
            });

            // Convert to array, sort descending, and take top 10
            const topEndpoints = Object.values(grouped)
                .sort((a, b) => b.total_requests - a.total_requests)
                .slice(0, 10); // <-- TOP 10

            return NextResponse.json(topEndpoints);
        }

        if (groupBy === "methods") {
            const totals = { total_post: 0, total_get: 0, total_put: 0, total_delete: 0 };
            (data || []).forEach(row => {
                totals.total_post += Number(row.post_count);
                totals.total_get += Number(row.get_count);
                totals.total_put += Number(row.put_count);
                totals.total_delete += Number(row.delete_count);
            });
            return NextResponse.json([totals]);
        }

        return NextResponse.json([]);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}