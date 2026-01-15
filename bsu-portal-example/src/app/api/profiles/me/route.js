// /app/api/profiles/me/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();

        if (profileError) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: user.id,
            username: profile.username || null,
        });
    } catch (err) {
        console.error("GET /api/profiles/me error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}


export async function DELETE() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { error: profileDeleteError } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", user.id);

        if (profileDeleteError) {
            console.error("Profile delete error:", profileDeleteError);
            return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
        }

        const { error: authDeleteError } =
            await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (authDeleteError) {
            console.error("Auth delete error:", authDeleteError);
            return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
        }

        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error("DELETE /api/me error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
