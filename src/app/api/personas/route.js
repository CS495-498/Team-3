import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req) {
    const { displayName } = await req.json();

    if (!displayName?.trim()) {
        return NextResponse.json(
            { error: "Persona name required" },
            { status: 400 }
        );
    }

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

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase
        .from("profiles")
        .update({ active_persona_id: data.id })
        .eq("id", user.id);

    return NextResponse.json(data, { status: 201 });
}
