import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";

export async function GET() {
  const supabase = await createClient();

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
