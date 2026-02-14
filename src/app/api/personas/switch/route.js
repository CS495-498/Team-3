import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import { withLogging } from '@/utils/withLogging';

async function handlePatch(req) {
    const { personaId } = await req.json();

    const supabase = await createClient();

    // ---- AUTH ----
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

export const PATCH = withLogging(handlePatch);
