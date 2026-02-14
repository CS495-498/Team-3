import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { withLogging } from '@/utils/withLogging';

async function handleGet() {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, username, avatar_url, active_persona_id")
            .eq("id", user.id)
            .single();

        if (profileError) {
            return NextResponse.json(
                { error: "Profile not found" },
                { status: 404 }
            );
        }

        const { data: personas, error: personasError } = await supabase
            .from("personas")
            .select("*")
            .eq("owner_id", user.id);

        if (personasError) {
            return NextResponse.json(
                { error: personasError.message },
                { status: 500 }
            );
        }

        const activePersona =
            profile.active_persona_id
                ? personas.find(p => p.id === profile.active_persona_id) ?? null
                : null;

        return NextResponse.json({
            id: user.id,
            full_name: profile.full_name ?? "",
            username: profile.username ?? "",
            avatar_url: profile.avatar_url ?? "",
            personas,
            activePersona,
        });
    } catch (err) {
        console.error("GET /api/profiles/me error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}


async function handleDelete() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // ---- DELETE PERSONAS FIRST ----
        const { error: personaDeleteError } = await supabaseAdmin
            .from("personas")
            .delete()
            .eq("owner_id", user.id);

        if (personaDeleteError) {
            console.error("Persona delete error:", personaDeleteError);
            return NextResponse.json(
                { error: "Failed to delete personas" },
                { status: 500 }
            );
        }

        // ---- DELETE PROFILE ----
        const { error: profileDeleteError } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", user.id);

        if (profileDeleteError) {
            console.error("Profile delete error:", profileDeleteError);
            return NextResponse.json(
                { error: "Failed to delete profile" },
                { status: 500 }
            );
        }

        // ---- DELETE AUTH USER LAST ----
        const { error: authDeleteError } =
            await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (authDeleteError) {
            console.error("Auth delete error:", authDeleteError);
            return NextResponse.json(
                { error: "Failed to delete user" },
                { status: 500 }
            );
        }

        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error("DELETE /api/profiles/me error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

async function handlePut(req) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const updates = {
            full_name: body.full_name?.trim() || null,
            username: body.username?.trim() || null,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", user.id);

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        // 204 = success, no response body
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error("PUT /api/profiles/me error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export const GET = withLogging(handleGet);
export const DELETE = withLogging(handleDelete);
export const PUT = withLogging(handlePut);

