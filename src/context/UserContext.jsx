"use client";

import { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext({ user: null, loading: true });

export function UserProvider({ children }) {
  // Try to initialize user from sessionStorage (fast)
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("currentUser");
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(!user); // only loading if not cached

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/profiles/me", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();

        // save to state
        setUser(data);

        // cache in sessionStorage for fast access across pages
        if (typeof window !== "undefined") {
          sessionStorage.setItem("currentUser", JSON.stringify(data));
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    // Always fetch to ensure data is fresh
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
