import { NextResponse } from "next/server";
import { updateAndPublishDemoWeb } from "./updateAndPublishDemoWeb.js";
import { deleteDemoWeb } from "./deleteDemoWeb.js";
import { createClient } from "@/utils/Supabase/server";

export async function PUT(req) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // or redirect("/login") if desired
  }

  try {
    const { entryUid, demos } = await req.json();

    // CALL HELPER (handles validation and errors)
    const result = await updateAndPublishDemoWeb(entryUid, demos);

    return NextResponse.json(result, { status: result.status });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { entryUid, demos } = await req.json();

    // CALL HELPER (handles validation and errors)
    const result = await deleteDemoWeb(entryUid, demos);

    return NextResponse.json(result, { status: result.status });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
