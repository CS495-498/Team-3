"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { UserProvider } from "@/context/UserContext";

function SidebarLayoutContent({ children }) {
  const { isMobile, open } = useSidebar();
  const desktopOffset = !isMobile && open ? "md:ml-64" : "md:ml-0";

  return (
    <main className={`min-h-screen overflow-auto transition-[margin] duration-200 ease-linear ${desktopOffset}`}>
      <div className="sticky top-0 z-30 flex items-center border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <SidebarTrigger
          showLabel
          className="border border-border bg-background shadow-sm hover:bg-accent"
        />
      </div>
      <div className="flex-1">
        {children}
      </div>
    </main>
  );
}

export default function WithSidebarLayout({ children }) {
  return (
    <UserProvider>
      <SidebarProvider>
        <div className="min-h-screen w-full bg-background">
          <AppSidebar />
          <SidebarLayoutContent>{children}</SidebarLayoutContent>
        </div>
      </SidebarProvider>
    </UserProvider>
  );
}
