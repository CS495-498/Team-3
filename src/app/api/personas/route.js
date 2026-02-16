import { NextResponse } from "next/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";
import { withLogging } from '@/utils/withLogging';

async function handlePost(req) {
    const { displayName } = await req.json();

    const { error2, profile, supabase } = await requireAuthWithPermission(
        PERMISSIONS.USE_PERSONAS
    );
    if (error2) return error;

    if (!displayName?.trim()) {
        return NextResponse.json(
            { error: "Persona name required" },
            { status: 400 }
        );
    }




    // ---- CREATE PERSONA ----
    const { data, error } = await supabase
        .from("personas")
        .insert({
            owner_id: profile.id,
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
        .eq("id", profile.id);

    return NextResponse.json(data, { status: 201 });
}

export const POST = withLogging(handlePost);
