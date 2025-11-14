import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/Supabase/server";

export async function GET(req, { params }) {
  const { id } = await params;
  const supabase = await createClient();


  const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .eq("id", id)
      .maybeSingle()

  if (error) {
    console.error("PROFILE API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }


  if (!data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(data, { status: 200 });
}


export async function PUT(req, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  if (user.id !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { username, full_name} = body;

  const { data, error } = await supabase
      .from("profiles")
      .update({
        username,
        full_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
