import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/Supabase/server";


export async function GET(req) {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  // Optional filters: ?sort=upvotes&limit=10
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "created_at";
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const { data, error } = await supabase
    .from("feature_requests")
    .select("*")
    .order(
      sort === "upvotes" ? "number_of_upvotes" : "created_at",
      { ascending: false }
    )
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}


export async function POST(req) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  const body = await req.json();
  const { Title, Content } = body;

  // Validate required fields
  if (!Title || !Content) {
    return NextResponse.json(
      { error: "Title and Content are required" },
      { status: 400 }
    );
  }

  // Insert new feature request
  const { data, error } = await supabase
    .from("feature_requests")
    .insert([{ user_id: user.id, title: Title, content: Content }])
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
