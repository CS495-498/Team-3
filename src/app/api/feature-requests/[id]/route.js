import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";
import { hasPermission } from "@/utils/hasPermission";
import { sanitizeHtmlServer } from "@/lib/featureRequests/requests/sanitizeHtmlServer.js";


const TITLE_MAX_LENGTH = 100;

export async function PUT(req, { params }) {
    const { id } = params;
    const supabase = await createClient();

    const { error: authError, profile } =
        await requireAuthWithPermission(PERMISSIONS.PUBLISH_FEATURE_REQUESTS);
    if (authError) return authError;

    const body = await req.json();
    const { title, content, status } = body;

    const normalizedTitle = title?.toString().trim() || "";

    if (!normalizedTitle) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (normalizedTitle.length > TITLE_MAX_LENGTH) {
        return NextResponse.json(
            { error: `Title cannot exceed ${TITLE_MAX_LENGTH} characters` },
            { status: 400 }
        );
    }

    const canManageAll = hasPermission(
        profile.role,
        PERMISSIONS.MANAGE_ALL_FEATURE_REQUESTS
    );

    let query = supabase
        .from("feature_requests")
        .update({
            title: normalizedTitle,
            content: sanitizeHtmlServer(content),
            status,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (!canManageAll) {
        query = query.eq("user_id", profile.id);
    }

    const { data, error } = await query
        .select(`
      *,
      profiles!fk_feature_requests_author (
        id,
        username,
        avatar_url
      )
    `)
        .single();

    if (error || !data) {
        console.error("SUPABASE ERROR:", error);
        return NextResponse.json(
            { error: error?.message || "Forbidden" },
            { status: 403 }
        );
    }

    return NextResponse.json(data, { status: 200 });
}


export async function DELETE(req, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { error: authError, profile } =
    await requireAuthWithPermission(
      PERMISSIONS.PUBLISH_FEATURE_REQUESTS
    );

  if (authError) return authError;

  const canManageAll = hasPermission(
    profile.role,
    PERMISSIONS.MANAGE_ALL_FEATURE_REQUESTS
  );

  let query = supabase
    .from("feature_requests")
    .delete()
    .eq("id", id);

  if (!canManageAll) {
    query = query.eq("user_id", profile.id);
  }

  const { data, error } = await query.select();

  if (error || !data || data.length === 0) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

