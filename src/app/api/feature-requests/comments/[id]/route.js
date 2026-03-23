import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";
import { hasPermission } from "@/utils/hasPermission";
import { withLogging } from "@/utils/withLogging";

async function handlePut(req, { params }) {
    const { id } = await params;
    const supabase = await createClient();

    const { error, profile } = await requireAuthWithPermission(
        PERMISSIONS.COMMENT_VOTE_FEATURE_REQUESTS
    );

    if (error) return error;

    const { content } = await req.json();

    if (!content || !content.trim()) {
        return NextResponse.json(
            { error: "Comment cannot be empty" },
            { status: 400 }
        );
    }

    try {
        // get comment
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
        const canManageAll = hasPermission(
            profile.role,
            PERMISSIONS.MANAGE_ALL_COMMENTS
        );

        if (!isOwner && !canManageAll) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const { data, error: updateErr } = await supabase
            .from("feature_request_comments")
            .update({
                content: content.trim(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (updateErr) throw updateErr;

        return NextResponse.json(data, { status: 200 });

    } catch (err) {
        console.error("Edit comment error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}


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
        const canManageAll = hasPermission(
            profile.role,
            PERMISSIONS.MANAGE_ALL_COMMENTS
        );

        if (!isOwner && !canManageAll) {
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

export const PUT = withLogging(handlePut);
export const DELETE = withLogging(handleDelete);