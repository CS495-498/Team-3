import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/Supabase/server";

/**
 * GET - Fetch all comments for a specific feature request
 */
export async function GET(req, { params }) {
  const { id } = await params; // feature_request_id
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Fetch comments for the given feature request
  const { data, error } = await supabase
    .from("feature_request_comments")
    .select(`
      id,
      content,
      created_at,
      updated_at,
      user_id,
      users:auth.users(email)
    `)
    .eq("feature_request_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

/**
 * POST - Add a comment to a specific feature request
 */
export async function POST(req, { params }) {
  const { id } = await params; // feature_request_id
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

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
        user_id: user.id,
        content,
      },
    ])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
