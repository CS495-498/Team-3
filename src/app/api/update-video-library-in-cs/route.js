import { NextResponse } from "next/server";
import { updateAndPublishVideos } from "./updateAndPublishVideos.js";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission.js";
import PERMISSIONS from "@/config/permissions";
import { withLogging } from '@/utils/withLogging';

export async function handlePut(req) {

const { error, profile, supabase } = await requireAuthWithPermission(
    PERMISSIONS.UPLOAD_VIDEO_LIBRARY
  );
  if (error) return error;

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // or redirect("/login") if desired
  }

  try {
    const { entryUid, videos } = await req.json();
    const result = await updateAndPublishVideos(entryUid, videos);

    return NextResponse.json(result, { status: result.status });
  } catch (err) {
    console.error("Server update/publish failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const PUT = withLogging(handlePut);
