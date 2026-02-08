import { NextResponse } from "next/server";
import { createClient } from "@/utils/Supabase/server";
import requirePermission from "@/utils/auth/requirePermission";
import ROLE_PERMISSIONS from "@/config/rolePermissions";


export default async function requireAuthWithPermission(permission) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  console.log("🔐 requireAuthWithPermission");



  if (authError || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: NextResponse.json({ error: "Profile not found" }, { status: 404 }),
    };


  }


console.log("User:", user);
console.log("Role:", profile?.role);
console.log("Permission required:", permission);
console.log(
  "Permissions for role:",
  ROLE_PERMISSIONS[profile?.role]
);

  const denial = requirePermission(profile.role, permission);
  if (denial) return { error: denial };

  return { user, profile, supabase };
}
