import { NextResponse } from "next/server";

import PERMISSIONS from "@/config/permissions";
import { decodeFeatureRequestImagePath } from "@/lib/featureRequests/images.js";
import { createServiceRoleClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import { withLogging } from "@/utils/withLogging";

async function handleGet(_req, { params }) {
    const { error: authError } = await requireAuthWithPermission(
        PERMISSIONS.VIEW_CONTENT
    );

    if (authError) return authError;

    const { path = [] } = await params;
    const filePath = decodeFeatureRequestImagePath(path);

    if (!filePath) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const serviceRoleClient = await createServiceRoleClient();
    const { data, error } = await serviceRoleClient.storage
        .from("feature-uploads")
        .createSignedUrl(filePath, 60 * 60);

    if (error || !data?.signedUrl) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.redirect(data.signedUrl);
}

export const GET = withLogging(handleGet);
