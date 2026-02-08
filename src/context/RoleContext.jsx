"use client";

import { createContext, useContext, useEffect, useState } from "react";
import ROLE_PERMISSIONS from "@/config/rolePermissions";

const RoleContext = createContext({
  role: null,
  permissions: [],
  loading: true,
});

export function RoleProvider({ children }) {
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if role is already cached in sessionStorage
    const cachedRole = sessionStorage.getItem("userRole");

    if (cachedRole) {
      setRole(cachedRole);
      setPermissions(ROLE_PERMISSIONS[cachedRole] || []);
      setLoading(false);
      return;
    }

    // Fetch role from API if not cached
    async function fetchRole() {
      try {
        const res = await fetch("/api/profiles/me", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch role");

        const data = await res.json();
        setRole(data.role);
        setPermissions(ROLE_PERMISSIONS[data.role] || []);

        // Cache in sessionStorage for this browser session
        sessionStorage.setItem("userRole", data.role);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, []);

  return (
    <RoleContext.Provider value={{ role, permissions, loading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
