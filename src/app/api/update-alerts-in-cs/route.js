import { NextResponse } from "next/server";
import { updateAndPublishAlert } from "./updateAndPublishAlert.js";
import { createClient } from "@/utils/Supabase/server";

export async function PUT(req) {

  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // or redirect("/login") if desired
  }

  try {
    const { entryUid, alerts } = await req.json();

    const result = await updateAndPublishAlert(entryUid, alerts);

    return NextResponse.json(result, { status: result.status });
  } catch (err) {
    console.error("Server update/publish failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
