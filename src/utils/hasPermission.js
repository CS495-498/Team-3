// utils/hasPermission.js
import { ROLE_PERMISSIONS } from "@/config/rolePermissions";

export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
