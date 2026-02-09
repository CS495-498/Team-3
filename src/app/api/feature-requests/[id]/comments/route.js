import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";

export async function GET(req, { params }) {
  const { id } = await params;
  const supabase = await createClient();


    // Get logged-in user
     const { error2, profile } = await requireAuthWithPermission(

    PERMISSIONS.VIEW_CONTENT
  );

  if (error2) return error2

  const { data, error } = await supabase
      .from("feature_request_comments")
      .select(`
      id,
      content,
      created_at,
      user_id,
      user:profiles(username)
    `)
      .eq("feature_request_id", id)
      .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

    const normalized = (data || []).map((c) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        username: c.user?.username || null,
    }));

    return NextResponse.json(normalized, { status: 200 });
}

export async function POST(req, { params }) {
  const { id } = await params; // feature_request_id
  const supabase = await createClient();

  // Authenticate user
    // Get logged-in user
     const { error2, profile } = await requireAuthWithPermission(

    PERMISSIONS.COMMENT_VOTE_FEATURE_REQUESTS
  );

  if (error2) return error2

  // Parse request body
  const body = await req.json();
  const { content } = body;

  if (!content || content.trim() === "") {
    return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
    );
  }

  // Insert the comment
  const { data, error } = await supabase
      .from("feature_request_comments")
      .insert([
        {
          feature_request_id: id,
          user_id: profile.id,
          content,
        },
      ])
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(
        {
            id: data.id,
            content: data.content,
            created_at: data.created_at,
            user_id: data.user_id,
            username: data.user?.username || null,
        },
        { status: 201 }
    );

}