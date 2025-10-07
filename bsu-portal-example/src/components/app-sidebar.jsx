import { Calendar, ChevronUp, Home, Inbox, Search, Settings, TvMinimalPlay, User2 } from "lucide-react"
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import { ModeToggle } from "./mode-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import React from "react";
import { useState, useEffect } from "react";
import Stack, { onEntryChange } from "@/lib/cstack";

function NavProjectsSkeleton() {
  return (
    <SidebarMenu>
      {Array.from({ length: 5 }).map((_, index) => (
        <SidebarMenuItem key={index}>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
function NavProjects(){
  const [entry, setEntry] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const getContent = async () => {
    const entry = await Stack.getElementByTypeWithRefs(
      "homepage",
      "en-us",
      ["header","alerts",
      ]
    );
    console.log("homepage", entry[0][0]);
    console.log("alerts", entry[0][0]?.alerts);
    setEntry(entry[0][0]);
    setIsLoading(false);
  };

  useEffect(() => {
    onEntryChange(getContent);
  }, []);

  if (isLoading) return (<SidebarMenu>
        {Array.from({ length: 5 }).map((_, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>)

console.log(entry)
   return (
    <SidebarMenu>
      {entry?.header?.[0]?.navigation_menu.map((item, index) => (
        <SidebarMenuItem key={index}>
          <SidebarMenuButton asChild>
            <Link href={item.call_to_action.href}>
              <Search />
              <span>{item.call_to_action.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );    
}

export function AppSidebar() {
  return (
    <Sidebar  collapsible="offcanvas">
      <SidebarHeader>/</SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Contentstack Portal</SidebarGroupLabel>
          <SidebarGroupContent>

              <React.Suspense fallback={<NavProjectsSkeleton />}>
              <NavProjects />
            </React.Suspense>

          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter><ModeToggle /><SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton>
                <User2 /> Username
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              className="w-[--radix-popper-anchor-width]"
            >
              <DropdownMenuItem>
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu></SidebarFooter>
    </Sidebar>
  )
}