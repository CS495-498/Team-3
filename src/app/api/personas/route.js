import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import { withLogging } from '@/utils/withLogging';

async function handlePost(req) {
    const { displayName } = await req.json();

    if (!displayName?.trim()) {
        return NextResponse.json(
            { error: "Persona name required" },
            { status: 400 }
        );
    }

    const supabase = await createClient();

    // ---- AUTH ----
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ---- CREATE PERSONA ----
    const { data, error } = await supabase
        .from("personas")
        .insert({
            owner_id: user.id,
            full_name: displayName.trim(),
            username: null,
            avatar_url: null,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }

    // ---- SET ACTIVE PERSONA ----
    await supabase
        .from("profiles")
        .update({ active_persona_id: data.id })
        .eq("id", user.id);

    return NextResponse.json(data, { status: 201 });
}

export const POST = withLogging(handlePost);
