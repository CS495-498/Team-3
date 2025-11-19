import { NextResponse } from "next/server";
import { updateAndPublishVideos } from "./updateAndPublishVideos.js";

export async function PUT(req) {
  try {
    const { entryUid, videos } = await req.json();
    const result = await updateAndPublishVideos(entryUid, videos);

    return NextResponse.json(result, { status: result.status });
  } catch (err) {
    console.error("Server update/publish failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
