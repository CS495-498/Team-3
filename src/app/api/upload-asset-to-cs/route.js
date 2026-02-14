import { NextResponse } from "next/server";
import { uploadAndPublishAsset } from "./uploadAndPublishAsset";
import { createClient } from "@/utils/Supabase/server";
import { withLogging } from '@/utils/withLogging';

async function handlePost(req) {

  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // or redirect("/login") if desired
  }
  const formData = await req.formData();
  const result = await uploadAndPublishAsset(formData);
  return NextResponse.json(result, { status: result.status });
}

export const POST = withLogging(handlePost);
