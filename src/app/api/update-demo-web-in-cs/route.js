import { NextResponse } from "next/server";
import { updateAndPublishDemoWeb } from "./updateAndPublishDemoWeb.js";
import { deleteDemoWeb } from "./deleteDemoWeb.js";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission.js";
import PERMISSIONS from "@/config/permissions";

export async function PUT(req) {

const { error, profile, supabase } = await requireAuthWithPermission(
    PERMISSIONS.UPLOAD_DEMO_WEBSITES
  );
  if (error) return error;

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
  const { error, profile, supabase } = await requireAuthWithPermission(
    PERMISSIONS.UPLOAD_DEMO_WEBSITES
  );
  if (error) return error;

  try {
    const { entryUid, demos } = await req.json();

    // CALL HELPER (handles validation and errors)
    const result = await deleteDemoWeb(entryUid, demos);

    return NextResponse.json(result, { status: result.status });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
