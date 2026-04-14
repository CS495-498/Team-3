"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { UserProvider } from "@/context/UserContext";

function SidebarLayoutContent({ children }) {
  const { isMobile } = useSidebar();

  return (
    <main
      className="relative flex min-h-screen min-w-0 flex-1 flex-col overflow-auto bg-background"
      style={{
        marginLeft: isMobile ? "0px" : "calc(var(--sidebar-width-icon, 2.5rem) + 0.25rem)",
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
