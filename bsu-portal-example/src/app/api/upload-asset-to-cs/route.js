import { NextResponse } from "next/server";
import { uploadAndPublishAsset } from "./uploadAndPublishAsset";

export async function POST(req) {
  const formData = await req.formData();
  const result = await uploadAndPublishAsset(formData);
  return NextResponse.json(result, { status: result.status });
}
