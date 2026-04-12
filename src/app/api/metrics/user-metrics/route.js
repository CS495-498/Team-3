import { NextResponse } from "next/server";
import PERMISSIONS from "@/config/permissions.js";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission.js";

export async function GET(request) {
    try {

        const { error: authError, supabase } =
            await requireAuthWithPermission(PERMISSIONS.VIEW_METRICS);

        if (authError) return authError;

        const { searchParams } = new URL(request.url);

        const startDate = searchParams.get("start_date");
        const endDate = searchParams.get("end_date");
        const dateFilter = searchParams.get("dateFilter");


        let query = supabase
            .from("daily_user_metrics")
            .select(`
                user_id,
                date,
                post_count,
                get_count,
                put_count,
                delete_count
            `);

        if (startDate) query = query.gte("date", startDate);
        if (endDate) query = query.lte("date", endDate);

        query = query.gte("date", dateFilter);

        const { data, error } = await query;

        if (error) throw error;

        // -------- Aggregate by User --------

        const grouped = {};

        (data || []).forEach(row => {

            if (!grouped[row.user_id]) {
                grouped[row.user_id] = {
                    user_id: row.user_id,
                    start_date: row.date,
                    end_date: row.date,
                    total_post: 0,
                    total_get: 0,
                    total_put: 0,
                    total_delete: 0
                };
            }

            const bucket = grouped[row.user_id];

            bucket.start_date =
                row.date < bucket.start_date
                    ? row.date
                    : bucket.start_date;

            bucket.end_date =
                row.date > bucket.end_date
                    ? row.date
                    : bucket.end_date;

            bucket.total_post += Number(row.post_count || 0);
            bucket.total_get += Number(row.get_count || 0);
            bucket.total_put += Number(row.put_count || 0);
            bucket.total_delete += Number(row.delete_count || 0);
        });

        const result = Object.values(grouped).map(row => ({
            ...row,
            total_requests:
                row.total_post +
                row.total_get +
                row.total_put +
                row.total_delete
        }));

        return NextResponse.json(result);

    } catch (err) {

        console.error(err);

        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}