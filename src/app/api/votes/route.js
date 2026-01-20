import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";

export async function GET() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json([], { status: 200 });
    }

    const { data, error } = await supabase
        .from("votes")
        .select("req_id, Upvoted")
        .eq("user_id", user.id);

    if (error) {
        return NextResponse.json([], { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
}
