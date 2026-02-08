"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { RoleProvider } from "@/context/RoleContext";



export default function WithSidebarLayout({ children }) {
  return (
    <RoleProvider>
    <SidebarProvider>
      <div className="flex min-h-screen w-screen">
        
        {/* Sidebar wrapper that prevents flex growth */}
        <div className=" sticky top-0 col-span-1 h-screen">
          <AppSidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
    </RoleProvider>
  );
}