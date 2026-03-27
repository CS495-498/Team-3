import { NextResponse } from "next/server";
import { updateAndPublishVideos } from "./updateAndPublishVideos.js";
import { deleteAndPublishVideos } from "./deleteAndPublishVideos.js";
import { deleteAssets } from "../delete-assets-from-cs/deleteAssets.js";
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

async function handleDelete(req) {
  const { error } = await requireAuthWithPermission(
    PERMISSIONS.UPLOAD_VIDEO_LIBRARY
  );
  if (error) return error;

  try {
    const { entryUid, videos, assetUids = [] } = await req.json();
    const result = await deleteAndPublishVideos(entryUid, videos);

    if (result.status !== 200) {
      return NextResponse.json(result, { status: result.status });
    }

    const assetDeleteResult = await deleteAssets(assetUids);
    if (assetDeleteResult.status !== 200) {
      return NextResponse.json(
        {
          ...assetDeleteResult,
          entry: result.entry,
        },
        { status: assetDeleteResult.status }
      );
    }

    return NextResponse.json(
      {
        ...result,
        deletedAssetUids: assetDeleteResult.deletedAssetUids,
      },
      { status: result.status }
    );
  } catch (err) {
    console.error("Server video delete failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const PUT = withLogging(handlePut);
export const DELETE = withLogging(handleDelete);
