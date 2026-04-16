"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { UserProvider } from "@/context/UserContext";

const SIDEBAR_PIN_STORAGE_KEY = "app-sidebar-pinned";
const SIDEBAR_PIN_EVENT = "app-sidebar-pin-change";

function SidebarLayoutContent({ children }) {
  const { isMobile } = useSidebar();
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const syncPinnedState = () => {
      setIsPinned(window.localStorage.getItem(SIDEBAR_PIN_STORAGE_KEY) === "true");
    };

    syncPinnedState();
    window.addEventListener("storage", syncPinnedState);
    window.addEventListener(SIDEBAR_PIN_EVENT, syncPinnedState);

    return () => {
      window.removeEventListener("storage", syncPinnedState);
      window.removeEventListener(SIDEBAR_PIN_EVENT, syncPinnedState);
    };
  }, []);

  return (
    <main
      className="relative flex min-h-screen min-w-0 flex-1 flex-col overflow-auto bg-background"
      style={{
        marginLeft: isMobile
          ? "0px"
          : isPinned
            ? "var(--sidebar-width, 16rem)"
            : "calc(var(--sidebar-width-icon, 2.5rem) + 0.25rem)",
      }}
    >
      <div className="flex-1">
        {children}
      </div>
    </main>
  );
}

export default function WithSidebarLayout({ children }) {
  return (
    <UserProvider>
      <SidebarProvider defaultOpen={false}>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <SidebarLayoutContent>{children}</SidebarLayoutContent>
        </div>
      </SidebarProvider>
    </UserProvider>
  );
}
