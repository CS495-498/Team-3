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

    const { data, dataError } = await supabase
        .from("votes")
        .select(`
        user_id,
        req_id,
        upvoter_username
        `)
        .eq("req_id", id)
    if (dataError) {
        console.error(dataError);
        return NextResponse.json({ error: dataError.message}, { status: 500 });
    }

    const normalized = (data || []).map((c) => ({
        id: c.id,
        content: c.content,
        upvoter_username: c.user?.upvoter_username || null,
    }))

    return NextResponse.json(normalized, { status: 200 });

}
export const GET = withLogging(handleGet)