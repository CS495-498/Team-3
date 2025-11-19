import { NextResponse } from "next/server";
import { updateAndPublishDemoWeb } from "./updateAndPublishDemoWeb.js";

export async function PUT(req) {
  try {
    const { entryUid, demos } = await req.json();

    const result = await updateAndPublishDemoWeb(entryUid, demos);

    return NextResponse.json(result, { status: result.status });
  } catch (err) {
    console.error("Server update/publish failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
