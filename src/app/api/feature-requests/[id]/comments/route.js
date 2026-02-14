import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import { withLogging } from '@/utils/withLogging';

async function handleGet(req, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json(data, { status: 200 });
}

async function handlePost(req, { params }) {
  const { id } = await params; // feature_request_id
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

export const GET = withLogging(handleGet);
export const POST = withLogging(handlePost);