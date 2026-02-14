import { NextResponse } from "next/server";
import ROLE_PERMISSIONS from "@/config/rolePermissions";

export default function requirePermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role];

  if (!permissions || !permissions.includes(permission)) {
    return NextResponse.json(
      { error: "Forbidden: insufficient permissions" },
      { status: 403 }
    );
  }

  return null;
}
