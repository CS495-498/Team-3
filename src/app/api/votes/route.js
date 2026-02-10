import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission.js";
import PERMISSIONS from "@/config/permissions";

export async function GET() {
const { error2, profile, supabase } = await requireAuthWithPermission(
    PERMISSIONS.VIEW_CONTENT
  );
  if (error2) return error2;

    const { data, error } = await supabase
        .from("votes")
        .select("req_id, Upvoted")
        .eq("user_id", user.id);

    if (error) {
        return NextResponse.json([], { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
}
