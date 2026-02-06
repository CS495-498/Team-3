import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";

export async function POST(req) {
    const { displayName } = await req.json();

    const { error2, supabase } = await requireAuthWithPermission(
        req,
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
