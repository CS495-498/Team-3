import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";

// GET all users/profiles
export async function GET() {
  // ---- AUTH: MUST HAVE MANAGE USERS PERMISSION ----
    const { error, supabase } = await requireAuthWithPermission(
        req,
        PERMISSIONS.MANAGE_USERS
    );

    if (error) return error;

  const { data, fetchError } = await supabase
    .from("profiles")
    .select("*");

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
