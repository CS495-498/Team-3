import { NextResponse } from "next/server";
import { updateAndPublishAlert } from "./updateAndPublishAlert.js";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission.js";
import PERMISSIONS from "@/config/permissions";
import { withLogging } from '@/utils/withLogging';

async function handlePut(req) {

const { error, supabase } = await requireAuthWithPermission(
    PERMISSIONS.UPLOAD_NOTIFICATIONS
  );
  if (error) return error;


  try {
    const { entryUid, alerts } = await req.json();

    const result = await updateAndPublishAlert(entryUid, alerts);

    return NextResponse.json(result, { status: result.status });
  } catch (err) {
    console.error("Server update/publish failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const PUT = withLogging(handlePut);
