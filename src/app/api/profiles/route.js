import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import { createServiceRoleClient } from "@/utils/Supabase/server";
import PERMISSIONS from "@/config/permissions";

// GET all users/profiles
export async function GET() {
  // ---- AUTH: MUST HAVE MANAGE USERS PERMISSION ----
    const { error, supabase } = await requireAuthWithPermission(
        PERMISSIONS.MANAGE_USERS
    );

    if (error) return error;

  const supabaseServiceRole = await createServiceRoleClient();

  const { data, fetchError } = await supabaseServiceRole
    .from("admin_user_view")
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
