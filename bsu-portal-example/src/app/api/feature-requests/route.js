import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
  
    if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { data, error } = await supabase
      .from("feature_requests")
      .select("*")
      .order("created_at", { ascending: false });

  if (error) {
    console.error("FEATURE REQUEST API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function POST(req) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, content } = body; // Only accept title and content

  if (!title || title.trim() === "") {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  // Insert new feature request with default status "open"
  const { data, error } = await supabase
    .from("feature_requests")
    .insert([
      {
        title,
        content,
        status: "open", // force default status
        user_id: user.id,
      },
    ])
    .select(`*, user:profiles(username)`) // include username
    .single();

  if (error) {
    console.error("FEATURE REQUEST POST ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = {
    ...data,
    username: data.user.username,
    commentCount: 0, // new requests start with 0 comments
  };

  return NextResponse.json(response, { status: 201 });
}
