import { NextResponse } from "next/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/Supabase/server.js";
import { fileTypeFromBuffer } from "file-type";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";
import { isValidRole } from "@/config/rolePermissions";
import { createServiceRoleClient } from "@/utils/Supabase/server";
import { createClient as createClientServer } from "@/utils/Supabase/server";

// Service role client (used for storage + signed URLs, bypasses RLS)
const supabaseServiceRole = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];


// -------------------- GET PROFILE --------------------
export async function GET(req, context) {

    const supabase = await createClientServer();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;

    const { data, error } = await supabase
        .from("public_profiles")
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

    const supabase = await createClient(); // cookie-based session client

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.id !== id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("active_persona_id")
        .eq("id", user.id)
        .single();

    if (profileError) {
        return NextResponse.json(
            { error: profileError.message },
            { status: 500 }
        );
    }

    const activePersonaId = profile.active_persona_id;

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

        if (
            !detectedType ||
            !ALLOWED_IMAGE_TYPES.includes(detectedType.mime)
        ) {
            return NextResponse.json(
                { error: "Invalid file type" },
                { status: 400 }
            );
        }

        const avatarOwnerId = activePersonaId ?? user.id;

        filePath = `${avatarOwnerId}.${detectedType.ext}`;

        const { error: uploadError } =
            await supabaseServiceRole.storage
                .from("avatars")
                .upload(filePath, buffer, {
                    contentType: detectedType.mime,
                    upsert: true,
                });

        if (uploadError) {
            return NextResponse.json(
                { error: uploadError.message },
                { status: 500 }
            );
        }
    }

    let updatedRecord;

    if (activePersonaId) {
        const { data, error } = await supabase
            .from("personas")
            .update({
                avatar_url: filePath,
            })
            .eq("id", activePersonaId)
            .eq("owner_id", user.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        updatedRecord = data;
    } else {
        const { data, error } = await supabase
            .from("profiles")
            .update({
                username,
                full_name,
                avatar_url: filePath || undefined,
            })
            .eq("id", user.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        updatedRecord = data;
    }

    const enriched = { ...updatedRecord };

    if (updatedRecord.avatar_url) {
        const { data: urlData } =
            await supabaseServiceRole.storage
                .from("avatars")
                .createSignedUrl(
                    updatedRecord.avatar_url,
                    60 * 60
                );

        enriched.signed_avatar_url = urlData?.signedUrl ?? null;
    }

    return NextResponse.json(enriched, { status: 200 });

}

export async function PATCH(request, { params }) {
    const { id: profileId } = await params;

    // -------------------------
    // 1. AUTHORIZATION, ADMIN Only
    // -------------------------
    const { error, supabase } = await requireAuthWithPermission(
        PERMISSIONS.MANAGE_USERS
    );

    if (error) return error;

    // -------------------------
    // 2. PARSE BODY
    // -------------------------
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
        );
    }

    const {
        email,
        role,
        full_name,
        username,
        active_persona_id,
    } = body;

    // -------------------------
    // 3. VALIDATION
    // -------------------------
    if (role && !isValidRole(role)) {
        return NextResponse.json(
            { error: "Invalid role" },
            { status: 400 }
        );
    }

    // -------------------------
    // 4. UPDATE AUTH EMAIL (ADMIN)
    // -------------------------
    const serviceSupabase = await createServiceRoleClient();
    if (email) {


        const { data: users, error: listError } =
            await serviceSupabase.auth.admin.listUsers({
                page: 1,
                perPage: 1000,
            });

        if (listError) {
            return NextResponse.json(
                { error: "Failed to validate email" },
                { status: 500 }
            );
        }

        const emailTaken = users.users.find(
            (u) => u.email === email && u.id !== profileId
        );

        if (emailTaken) {
            return NextResponse.json(
                { error: "Email already in use by another account" },
                { status: 409 }
            );
        }

        // -------------------------
        // 5. UPDATE AUTH EMAIL
        // -------------------------
        const { error: emailError } =
            await serviceSupabase.auth.admin.updateUserById(profileId, {
                email,
            });

        if (emailError) {
            return NextResponse.json(
                { error: emailError.message },
                { status: 400 }
            );
        }
    }

    // -------------------------
    // 5. UPDATE PROFILE TABLE
    // -------------------------
    const updates = {
        ...(role !== undefined && { role }),
        ...(full_name !== undefined && { full_name }),
        ...(username !== undefined && { username }),
        ...(active_persona_id !== undefined && { active_persona_id }),
        updated_at: new Date().toISOString(),
    };

    let updatedProfile = null;

    if (Object.keys(updates).length > 1) {
        const { data, error: updateError } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", profileId)
            .select()
            .single();

        if (updateError) {
            console.error("Profile update error:", updateError);
            return NextResponse.json(
                { error: updateError.message },
                { status: 500 }
            );
        }

        updatedProfile = data;
    }

    // -------------------------
    // 6. SUCCESS
    // -------------------------

    // Fetch the updated Auth user email
    const { data: authUser, error: authError } = await serviceSupabase.auth.admin.getUserById(profileId);

    if (authError || !authUser?.user) {
        console.error("Failed to fetch updated auth user:", authError);
    }

    // Combine profile and auth email
    const fullUpdatedUser = {
        ...updatedProfile,
        email: authUser?.user?.email || updatedProfile?.email || null,
    };
    return NextResponse.json(
        fullUpdatedUser,
        { status: 200 }
    );

}

// -------------------- DELETE PROFILE (ADMIN) --------------------
export async function DELETE(request, { params }) {
    const { id: profileId } = await params;

    // -------------------------
    // 1. AUTHORIZATION (ADMIN ONLY)
    // -------------------------
    const { error, supabase, user } = await requireAuthWithPermission(
        PERMISSIONS.MANAGE_USERS
    );

    if (error) return error;

    // Prevent admin from deleting themselves
    if (user.id === profileId) {
        return NextResponse.json(
            { error: "You cannot delete your own account." },
            { status: 400 }
        );
    }

    const serviceSupabase = await createServiceRoleClient();

    // -------------------------
    // 2. GET PROFILE (for avatar cleanup)
    // -------------------------
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", profileId)
        .single();

    if (profileError) {
        return NextResponse.json(
            { error: "Profile not found" },
            { status: 404 }
        );
    }

    // -------------------------
    // 3. DELETE AVATAR FROM STORAGE (if exists)
    // -------------------------
    if (profile?.avatar_url) {
        await serviceSupabase.storage
            .from("avatars")
            .remove([profile.avatar_url]);
        // no need to hard fail if this errors
    }

    // -------------------------
    // 4. DELETE PROFILE ROW
    // -------------------------
    const { error: deleteProfileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profileId);

    if (deleteProfileError) {
        return NextResponse.json(
            { error: deleteProfileError.message },
            { status: 500 }
        );
    }

    // -------------------------
    // 5. DELETE AUTH USER (CRITICAL STEP)
    // -------------------------
    const { error: deleteAuthError } =
        await serviceSupabase.auth.admin.deleteUser(profileId);

    if (deleteAuthError) {
        return NextResponse.json(
            { error: deleteAuthError.message },
            { status: 500 }
        );
    }

    // -------------------------
    // 6. SUCCESS
    // -------------------------
    return NextResponse.json(
        { message: "User deleted successfully" },
        { status: 200 }
    );
}


