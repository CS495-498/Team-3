"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";


export default function WithSidebarLayout({ children }) {
  return (
    <SidebarProvider>
      <div style={{ display: "flex", minHeight: "100vh", width: "100vw" }}>
        <AppSidebar />
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}