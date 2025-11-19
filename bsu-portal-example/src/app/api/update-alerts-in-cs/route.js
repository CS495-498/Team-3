import { NextResponse } from "next/server";
import { updateAndPublishAlert } from "./updateAndPublishAlert.js";

export async function PUT(req) {
  try {
    const { entryUid, alerts } = await req.json();

    const result = await updateAndPublishAlert(entryUid, alerts);

    return NextResponse.json(result, { status: result.status });
  } catch (err) {
    console.error("Server update/publish failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
