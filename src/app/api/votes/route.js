import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission.js";
import PERMISSIONS from "@/config/permissions";
import { withLogging } from '@/utils/withLogging';

async function handleGet() {
const { error2, profile, supabase } = await requireAuthWithPermission(
    PERMISSIONS.VIEW_CONTENT
  );
  if (error2) return error2;

    const { data, error } = await supabase
        .from("votes")
        .select("req_id, Upvoted")
        .eq("user_id", profile.id);

    if (error) {
        return NextResponse.json([], { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
}

export const GET = withLogging(handleGet);
