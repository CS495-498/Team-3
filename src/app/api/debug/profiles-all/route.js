import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server.js";

export async function GET() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, role, website, active_persona_id");

    return NextResponse.json({ data, error }, { status: 200 });
}
