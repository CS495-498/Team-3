import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import { createServiceRoleClient } from "@/utils/Supabase/server";
import PERMISSIONS from "@/config/permissions";
import { withLogging } from '@/utils/withLogging';

// GET all users/profiles
async function handleGet() {
  const { error } = await requireAuthWithPermission(
    PERMISSIONS.MANAGE_USERS
  );

  if (error) return error;

  const supabaseServiceRole = await createServiceRoleClient();

  const { data, error: fetchError } = await supabaseServiceRole
    .rpc("admin_get_users");


  if (fetchError) {
    return NextResponse.json(
      { error: fetchError.message },
      { status: 500 }
    );
  }

  const safeData = JSON.parse(JSON.stringify(data ?? []));

  return NextResponse.json(safeData, { status: 200 });
}

export const GET = withLogging(handleGet);
