import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import { withLogging } from '@/utils/withLogging';

async function handleDelete(req, { params }) {
    const { id } = await params;

    const supabase = await createClient();

    // ---- AUTH ----
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (persona.owner_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ---- CLEAR ACTIVE PERSONA ----
    await supabase
        .from("profiles")
        .update({ active_persona_id: null })
        .eq("id", user.id)
        .eq("active_persona_id", id);

    // ---- DELETE PERSONA ----
    const { error: deleteError } = await supabase
        .from("personas")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);

    if (deleteError) {
        return NextResponse.json(
            { error: deleteError.message },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}

export const DELETE = withLogging(handleDelete);
