import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";
import { withLogging } from '@/utils/withLogging';

async function handleGet(req, { params }){
    const { id } = await params;
    const supabase = await createClient();

    const { profileError, profile } = await requireAuthWithPermission(
        PERMISSIONS.VIEW_CONTENT
    )

    if (profileError) return profileError

    const { data, error } = await supabase
        .from("votes")
        .select(`
        user_id,
        req_id,
        upvoter_username
        `)
        .eq("req_id", id)
    if (error) {
        console.error(error);
        return NextResponse.json({ error: error.message}, { status: 500 });
    }

    const normalized = (data || []).map((c) => ({
        id: c.id,
        upvoter_username: c.upvoter_username || null,
    }))

    return NextResponse.json(normalized, { status: 200 });

}
export const GET = withLogging(handleGet)