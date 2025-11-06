import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/Supabase/server";

export async function GET(req, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("feature_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json(data, { status: 200 });
}


export async function PUT(req, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Get request body
  const body = await req.json();
  const { Title, Content } = body;

  if (!Content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  // Build update object dynamically
  const updateData = {
    updated_at: new Date().toISOString(),
  };
  if (Title) updateData.title = Title;
  updateData.content = Content;

  // Update only if the request belongs to the authenticated user
  const { data, error } = await supabase
    .from("feature_requests")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Request not found or not owned by user" },
      { status: 404 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}


export async function DELETE(req, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  const { data, error } = await supabase
    .from("feature_requests")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Always return 200, even if the row was already deleted
  return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
}