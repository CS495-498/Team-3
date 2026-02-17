import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import PERMISSIONS from "@/config/permissions.js";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission.js";

export async function GET(request) {
    try {
        const { error, supabase } = await requireAuthWithPermission(

            PERMISSIONS.VIEW_METRICS
        );

        if (error) return error;

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("start_date");
        const endDate = searchParams.get("end_date");

        let query = supabase.from("daily_user_metrics").select("*");

        if (startDate) query = query.gte("date", startDate);
        if (endDate) query = query.lte("date", endDate);

        const { data } = await query;

        if (error) {
            console.error(error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

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
                    total_delete: 0,
                    total_requests: 0,
                };
            }

            grouped[row.user_id].start_date = row.date < grouped[row.user_id].start_date ? row.date : grouped[row.user_id].start_date;
            grouped[row.user_id].end_date = row.date > grouped[row.user_id].end_date ? row.date : grouped[row.user_id].end_date;

            grouped[row.user_id].total_post += Number(row.post_count);
            grouped[row.user_id].total_get += Number(row.get_count);
            grouped[row.user_id].total_put += Number(row.put_count);
            grouped[row.user_id].total_delete += Number(row.delete_count);
            grouped[row.user_id].total_requests += Number(row.request_count);
        });

        return NextResponse.json(Object.values(grouped));
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}