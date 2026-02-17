import { NextResponse } from "next/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";
import { withLogging } from '@/utils/withLogging';

async function handleDelete(req, { params }) {
    const { id } = await params;

    // ---- AUTH: MUST HAVE USE_PERSONAS PERMISSION ----
    const { error, profile, supabase } = await requireAuthWithPermission(
        PERMISSIONS.USE_PERSONAS
    );

    if (error) return error;

    // ---- FETCH PERSONA ----
    const { data: persona, error: personaError } = await supabase
        .from("personas")
        .select("id, owner_id")
        .eq("id", id)
        .single();

    if (personaError || !persona) {
        return NextResponse.json(
            { error: "Persona not found" },
            { status: 404 }
        );
    }

    if (persona.owner_id !== profile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ---- CLEAR ACTIVE PERSONA ----
    await supabase
        .from("profiles")
        .update({ active_persona_id: null })
        .eq("id", profile.id)
        .eq("active_persona_id", id);

    // ---- DELETE PERSONA ----
    const { error: deleteError } = await supabase
        .from("personas")
        .delete()
        .eq("id", id)
        .eq("owner_id", profile.id);

    if (deleteError) {
        return NextResponse.json(
            { error: deleteError.message },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}

export const DELETE = withLogging(handleDelete);
