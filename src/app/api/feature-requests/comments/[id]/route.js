import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";
import { hasPermission } from "@/utils/hasPermission";
import { withLogging } from "@/utils/withLogging";



/*
DELETE COMMENT
DELETE /api/feature-requests/comments/[id]
*/
async function handleDelete(req, { params }) {
    const { id } = await params;
    const supabase = await createClient();

    const { error, profile } = await requireAuthWithPermission(
        PERMISSIONS.COMMENT_VOTE_FEATURE_REQUESTS
    );

    if (error) return error;

    try {
        const { data: comment, error: fetchErr } = await supabase
            .from("feature_request_comments")
            .select("id, user_id")
            .eq("id", id)
            .single();

        if (fetchErr || !comment) {
            return NextResponse.json(
                { error: "Comment not found" },
                { status: 404 }
            );
        }

        const isOwner = comment.user_id === profile.id;


        if (!isOwner) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const { error: deleteErr } = await supabase
            .from("feature_request_comments")
            .delete()
            .eq("id", id);

        if (deleteErr) throw deleteErr;

        return NextResponse.json(
            { success: true },
            { status: 200 }
        );

    } catch (err) {
        console.error("Delete comment error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export const DELETE = withLogging(handleDelete);