import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import { fileTypeFromBuffer } from "file-type";
import { createServiceRoleClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/ogg"
];

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function GET() {
  const supabase = await createClient();
  
  const { error2, profile } = await requireAuthWithPermission(
  
    PERMISSIONS.VIEW_CONTENT
  );

  if (error2) return error2;

    const { data, error } = await supabase
        .from("feature_requests")
        .select(`
      *,
      profiles!fk_feature_requests_author (
        username
      )
    `)
        .order("created_at", { ascending: false });

  if (error) {
    console.error("FEATURE REQUEST API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

    const supabaseServiceRole = await createServiceRoleClient();

  // Attach signed URLs
  const enriched = await Promise.all(
    data.map(async (req) => {
      if (!req.file_url) return req;

            const { data: urlData, error: urlError } =
                await supabaseServiceRole.storage
                    .from("feature-uploads")
                    .createSignedUrl(req.file_url, 60 * 60);

      if (urlError) {
        console.error("Signed URL error:", urlError);
        return req;
      }

      return {
        ...req,
        signed_file_url: urlData.signedUrl,
      };
    })
  );

    return NextResponse.json(enriched, { status: 200 });
}

export async function POST(req) {
    const supabase = await createClient();

    const { error2, profile } = await requireAuthWithPermission(
  
    PERMISSIONS.PUBLISH_FEATURE_REQUESTS
  );

  if (error2) return error;


    const contentLength = req.headers.get("content-length");

  if (contentLength && Number(contentLength) > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

    const formData = await req.formData();
    const title = formData.get("title");
    const content = formData.get("content");
    const file = formData.get("file");

  if (!title || title.trim() === "") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

    let filePath = null;

  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

        const buffer = Buffer.from(await file.arrayBuffer());

    // Detect actual file type
    const detectedType = await fileTypeFromBuffer(buffer);
    if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Optional: sanitize images
    filePath = `uploads/${crypto.randomUUID()}.${detectedType.ext}`;

        const { error: uploadError } = await supabase.storage
            .from("feature-uploads")
            .upload(filePath, buffer, {
                contentType: detectedType.mime,
                upsert: false
            });

    if (uploadError) {
      console.error("File upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
  }

    const { data, error } = await supabase
        .from("feature_requests")
        .insert([
            {
                title,
                content,
                status: "open",
                user_id: profile.id,
                file_url: filePath
            }
        ])
        .select(`
      *,
      user:profiles!fk_feature_requests_author (
        username
      )
    `)
        .single();

  if (error) {
    console.error("Feature request insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = {
    ...data,
    username: data.user.username,
    commentCount: 0
  };

    return NextResponse.json(response, { status: 201 });
}
