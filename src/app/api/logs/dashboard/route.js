import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";

export async function GET(request) {
    try {
        const supabase = await createClient();

        // Auth verification
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse query params
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "30", 10);
        const search = searchParams.get("search") || "";
        const level = searchParams.get("level") || "";
        const status = searchParams.get("status") || "";
        const method = searchParams.get("method") || "";
        const timestamp = searchParams.get("timestamp") || "";

        // Calculate range for server-side pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        // Build query with count
        let query = supabase
            .from("logs")
            .select("*", { count: "exact" })
            .order("timestamp", { ascending: false });

        // Apply search filter (endpoint or message)
        if (search) {
            query = query.or(
                `endpoint.ilike.%${search}%,message.ilike.%${search}%`
            );
        }

        // Apply level filter
        if (level) {
            query = query.eq("level", level);
        }

        // Apply status code range filter
        if (status) {
            if (status === "2xx") {
                query = query.gte("status_code", 200).lt("status_code", 300);
            } else if (status === "4xx") {
                query = query.gte("status_code", 400).lt("status_code", 500);
            } else if (status === "5xx") {
                query = query.gte("status_code", 500).lt("status_code", 600);
            }
        }

        // Apply HTTP method filter (from JSONB metadata)
        if (method) {
            query = query.eq("metadata->>method", method);
        }

        // Apply timestamp cutoff filter
        if (timestamp) {
            query = query.gte("timestamp", timestamp);
        }

        // Apply pagination range
        query = query.range(from, to);

        const { data: logs, count, error } = await query;

        if (error) {
            console.error("Error fetching logs:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const total = count || 0;
        const hasMore = from + (logs?.length || 0) < total;

        return NextResponse.json({
            logs: logs || [],
            total,
            page,
            limit,
            hasMore,
        });
    } catch (err) {
        console.error("GET /api/logs/dashboard error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
