// /app/api/me/route.js  (Next.js App Router style)
import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server"; // adjust path to your createClient helper

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch profile from 'profiles' table (adjust column names if different)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ id: user.id, username: profile.username || null });
  } catch (err) {
    console.error("GET /api/me error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
