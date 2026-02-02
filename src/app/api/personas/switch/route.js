import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function PATCH(req) {
    const { personaId } = await req.json();

    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

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
