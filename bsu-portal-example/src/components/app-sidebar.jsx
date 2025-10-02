import { Calendar, Home, Inbox, Search, Settings, TvMinimalPlay } from "lucide-react"
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
} from "@/components/ui/sidebar"
import { ModeToggle } from "./mode-toggle"


export function AppSidebar({ content }) {
  let side_of_screen = content.side_of_screen
  return (
    <Sidebar side= {side_of_screen}>
      <SidebarHeader><img className="w-30 h-10 p-2" src={content.logo?.url} /></SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Contentstack Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {content.navigation_menu.map((item, index) => (
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
          </SidebarGroupContent>
        </SidebarGroup>
        
      </SidebarContent>
      <SidebarFooter><ModeToggle/></SidebarFooter>
    </Sidebar>
  )
}