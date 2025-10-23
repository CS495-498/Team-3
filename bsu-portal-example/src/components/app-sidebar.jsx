import { Calendar, ChevronUp, Home, Inbox, Search, Settings, TvMinimalPlay, User2, ChevronsLeftRightEllipsis, Construction } from "lucide-react"
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

const iconMapper = {
  Home: <Home />,
  Inbox: <Inbox />,
  Calendar: <Calendar />,
  Settings: <Settings />,
  TvMinimalPlay: <TvMinimalPlay />,
  Search: <Search />,
  User2: <User2 />,
  ChevronUp: <ChevronUp />,
  ChevronsLeftRightEllipsis: <ChevronsLeftRightEllipsis />,
  Construction: <Construction />,
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <NavProjectsSkeleton />; // Fallback UI
    }

    return this.props.children; 
  }
}

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
function NavProjects() {
  const [entry, setEntry] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const getContent = async () => {
    const entry = await Stack.getElementByTypeWithRefs(
      "homepage",
      "en-us",
      ["header",
      ]
    );
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

  return (
    <Sidebar side={entry?.header?.[0].side_of_screen} collapsible="none">
      <SidebarHeader className="p-0 mb-0"><img className="w-15 h-13 p-3" src={entry?.header?.[0].logo?.url} /></SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu>
              {entry?.header?.[0]?.navigation_menu.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild>
                    <Link href={item.call_to_action.href}>
                      {iconMapper[item.icon] || <Search />}
                      <span>{item.call_to_action.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
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
  );
}

export function AppSidebar({ children }) {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<NavProjectsSkeleton />}>
        <NavProjects />
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}