import { NextResponse } from "next/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission.js";
import PERMISSIONS from "@/config/permissions";
import { withLogging } from "@/utils/withLogging";
import { deleteAssets } from "./deleteAssets.js";

async function handleDelete(req) {
  const { error } = await requireAuthWithPermission(
    PERMISSIONS.UPLOAD_VIDEO_LIBRARY
  );
  if (error) return error;

  try {
    const { assetUids } = await req.json();
    const result = await deleteAssets(assetUids);

    return NextResponse.json(result, { status: result.status });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const DELETE = withLogging(handleDelete);
