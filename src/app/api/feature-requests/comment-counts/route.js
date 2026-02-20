import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request) {
    const { ids } = await request.json().catch(() => ({}));
    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({});

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: () => { },
            },
        }
    );

    const { data, error } = await supabase.rpc(
        "get_feature_request_comment_counts",
        { ids }
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const map = {};
    for (const row of data || []) {
        map[row.feature_request_id] = Number(row.comment_count || 0);
    }

    return NextResponse.json(map);
}
