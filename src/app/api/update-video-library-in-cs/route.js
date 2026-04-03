import { NextResponse } from "next/server";
import { updateAndPublishVideos } from "./updateAndPublishVideos.js";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission.js";
import PERMISSIONS from "@/config/permissions";
import { withLogging } from '@/utils/withLogging';

async function handlePut(req) {
  const { error } = await requireAuthWithPermission(
    PERMISSIONS.UPLOAD_VIDEO_LIBRARY
  );
  if (error) return error;

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
