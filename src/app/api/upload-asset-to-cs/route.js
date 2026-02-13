import { NextResponse } from "next/server";
import { uploadAndPublishAsset } from "./uploadAndPublishAsset";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission.js";
import PERMISSIONS from "@/config/permissions";

export async function POST(req) {

const { error, profile, supabase } = await requireAuthWithPermission(
    PERMISSIONS.UPLOAD_ASSET
  );
  if (error) return error;

  const formData = await req.formData();
  const result = await uploadAndPublishAsset(formData);
  return NextResponse.json(result, { status: result.status });
}
