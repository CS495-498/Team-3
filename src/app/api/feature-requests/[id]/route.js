import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";


export async function PUT(req, { params }) {
    const { id } = params;
    const supabase = await createClient();

  // Authenticate user
  // Authenticate user
     const { error2, profile } = await requireAuthWithPermission(
  
    PERMISSIONS.PUBLISH_FEATURE_REQUESTS
  );

  if (error2) return error;

    const body = await req.json();
    const { title, content, status } = body;

  if (!title || title.trim() === "") {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  // Update the feature request
    const { data, error } = await supabase
        .from("feature_requests")
        .update({
            title,
            content,
            status,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", profile.id)
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
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

    return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req, { params }) {
    const { id } = params;
    const supabase = await createClient();

    // Authenticate user
     const { error2, profile } = await requireAuthWithPermission(
  
    PERMISSIONS.PUBLISH_FEATURE_REQUESTS
  );

  if (error2) return error;

    try {
        const { data, error } = await supabase
            .from("feature_requests")
            .delete()
            .eq("id", id)
            .eq("user_id", profile.id)
            .select();

        if (error) {
            console.error("Delete feature request error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Delete request failed:", err);
    return NextResponse.json(
        { error: err.message || "Failed to delete" },
        { status: 500 }
    );
  }
}
