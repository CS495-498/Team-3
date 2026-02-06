import { NextResponse } from "next/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";

export async function PATCH(req) {
    const { personaId } = await req.json();

    const { error, supabase } = await requireAuthWithPermission(
        req,
        PERMISSIONS.USE_PERSONAS
    );
    if (error) return error;

    // ---- CLEAR ACTIVE PERSONA ----
    if (!personaId) {
        const { error } = await supabase
            .from("profiles")
            .update({ active_persona_id: null })
            .eq("id", user.id);

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    }

    // ---- VERIFY OWNERSHIP ----
    const { data: persona, error: personaError } = await supabase
        .from("personas")
        .select("id")
        .eq("id", personaId)
        .eq("owner_id", user.id)
        .single();

    if (personaError || !persona) {
        return NextResponse.json(
            { error: "Persona not found or forbidden" },
            { status: 403 }
        );
    }

    // ---- SET ACTIVE PERSONA ----
    const { error: updateError } = await supabase
        .from("profiles")
        .update({ active_persona_id: personaId })
        .eq("id", user.id);

    if (updateError) {
        return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
