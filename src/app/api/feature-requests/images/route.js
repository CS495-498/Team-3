import { NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";

import PERMISSIONS from "@/config/permissions";
import { buildFeatureRequestImageUrl } from "@/lib/featureRequests/images.js";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import { withLogging } from "@/utils/withLogging";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

async function handlePost(req) {
    const { error: authError, supabase } = await requireAuthWithPermission(
        PERMISSIONS.PUBLISH_FEATURE_REQUESTS
    );

    if (authError) return authError;

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
        return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedType = await fileTypeFromBuffer(buffer);

    if (!detectedType || !ALLOWED_IMAGE_TYPES.includes(detectedType.mime)) {
        return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const filePath = `embedded/${crypto.randomUUID()}.${detectedType.ext}`;

    const { error: uploadError } = await supabase.storage
        .from("feature-uploads")
        .upload(filePath, buffer, {
            contentType: detectedType.mime,
            upsert: false,
        });

    if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    return NextResponse.json(
        {
            src: buildFeatureRequestImageUrl(filePath),
            path: filePath,
        },
        { status: 201 }
    );
}

export const POST = withLogging(handlePost);
