import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fileTypeFromBuffer } from "file-type";

// Public client (used for auth + DB with RLS)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Service role client (used for storage + signed URLs, bypasses RLS)
const supabaseServiceRole = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];


// -------------------- GET PROFILE --------------------
export async function GET(req, context) {
  const { id } = await context.params;

  const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .eq("id", id)
      .maybeSingle();

  if (error) {
    console.error("PROFILE API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Add signed avatar URL if avatar exists
  let enriched = { ...data };

  if (data.avatar_url) {
    const { data: urlData, error: urlError } =
        await supabaseServiceRole.storage
            .from("avatars")
            .createSignedUrl(data.avatar_url, 60 * 60); // 1 hour

    if (!urlError) {
      enriched.signed_avatar_url = urlData.signedUrl;
    } else {
      console.error("Signed URL error:", urlError);
    }
  }

  return NextResponse.json(enriched, { status: 200 });
}


// -------------------- UPDATE PROFILE --------------------
export async function PUT(req, context) {
  const { id } = await context.params;

  // Get user from Authorization header
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const username = formData.get("username") || null;
  const full_name = formData.get("full_name") || null;

  let filePath = null;

  // -------- Handle Avatar Upload --------
  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedType = await fileTypeFromBuffer(buffer);

    if (!detectedType || !ALLOWED_IMAGE_TYPES.includes(detectedType.mime)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    filePath = `avatars/${user.id}.${detectedType.ext}`;

    const { error: uploadError } = await supabaseServiceRole.storage
        .from("avatars")
        .upload(filePath, buffer, {
          contentType: detectedType.mime,
          upsert: true,
        });

    if (uploadError) {
      console.error("Avatar Upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
  }

  const { data, error } = await supabase
      .from("profiles")
      .update({
        username,
        full_name,
        avatar_url: filePath || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

  if (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let enriched = { ...data };

  if (data.avatar_url) {
    const { data: urlData, error: urlError } =
        await supabaseServiceRole.storage
            .from("avatars")
            .createSignedUrl(data.avatar_url, 60 * 60);

    if (!urlError) {
      enriched.signed_avatar_url = urlData.signedUrl;
    }
  }


  return NextResponse.json(enriched, { status: 200 });
}