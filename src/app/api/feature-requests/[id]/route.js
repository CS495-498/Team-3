import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";
import { hasPermission } from "@/utils/hasPermission";

export async function PUT(req, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  // Authenticate (must at least be able to publish)
  const { error: authError, profile } =
    await requireAuthWithPermission(
      PERMISSIONS.PUBLISH_FEATURE_REQUESTS
    );

  if (authError) return authError;

  const body = await req.json();
  const { title, content, status } = body;

  if (!title || title.trim() === "") {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  // 🔥 Check if user can manage all
  const canManageAll = hasPermission(
    profile.role,
    PERMISSIONS.MANAGE_ALL_FEATURE_REQUESTS
  );

  // Base query
  let query = supabase
    .from("feature_requests")
    .update({
      title,
      content,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // If NOT admin → restrict to own record
  if (!canManageAll) {
    query = query.eq("user_id", profile.id);
  }

  console.log("ROLE:", profile.role);
console.log(
  "HAS MANAGE ALL:",
  hasPermission(profile.role, PERMISSIONS.MANAGE_ALL_FEATURE_REQUESTS)
);


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

  if (error) {
  console.error("SUPABASE ERROR:", error);
}

if (error || !data) {
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

  // 🔥 Only restrict ownership if NOT admin
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

