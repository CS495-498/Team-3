"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, ChevronRight, ChevronUp, Home, Inbox, Search, Settings, TvMinimalPlay, User2, ChevronsLeftRightEllipsis, Construction, ShieldUser } from "lucide-react";

import { useUser } from "@/context/UserContext";
import { hasPermission } from "@/utils/hasPermission";
import PERMISSIONS from "@/config/permissions";

import Stack, { onEntryChange } from "@/lib/cstack";
import SignOutButton from "./signout-button";
import AccountPageButton from "@/components/account-page-button.jsx";
import { createClient } from "@/utils/Supabase/client.js";
import { useCurrentAvatar } from "@/hooks/use-current-avatar.js";

import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarRail,
    SidebarMenuSkeleton,
    SidebarFooter,
} from "@/components/ui/sidebar";

import { ModeToggle } from "./mode-toggle";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@/components/ui/collapsible";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
};


const ADMIN_PAGES = [
    { title: "User Management", href: "/admin/usermanagement", permission: PERMISSIONS.MANAGE_USERS },
    { title: "Logs", href: "/admin/logs", permission: PERMISSIONS.VIEW_LOGS },
    { title: "Metrics", href: "/admin/metrics", permission: PERMISSIONS.VIEW_METRICS },
];

// ErrorBoundary for graceful fallback
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error(error, errorInfo);
    }

    render() {
        if (this.state.hasError) return <NavProjectsSkeleton />;
        return this.props.children;
    }
}

// Skeleton for loading sidebar
function NavProjectsSkeleton() {
    return (
        <SidebarMenu>
            {Array.from({ length: 5 }).map((_, index) => (
                <SidebarMenuItem key={index}>
                    <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}

export function NavProjects() {
    const [entry, setEntry] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const [isAdminOpen, setIsAdminOpen] = useState(true);

    const { user, loading } = useUser();
    const { signedAvatarUrl } = useCurrentAvatar(user);

    // Fetch Contentstack header/navigation
    useEffect(() => {
        async function getContent() {
            const res = await Stack.getElementByTypeWithRefs("header", "en-us", []);
            setEntry(res?.[0]?.[0] || {});
            setIsLoading(false);
        }
        onEntryChange(getContent);
        getContent();
    }, []);

    if (loading || !user || isLoading) return <SidebarRail />; // fallback while loading

    // Filter admin pages based on current user's role
    const allowedAdminPages = ADMIN_PAGES.filter((page) =>
        hasPermission(user.role, page.permission)
    );
    const hasAnyAdminAccess = allowedAdminPages.length > 0;

    return (
        <Sidebar
            side={entry?.side_of_screen}
            collapsible="none"
            className="dark:bg-[#0f0f11] bg-white transition-colors"
        >
            {/* Header */}
            <SidebarHeader className="p-0 mb-0 border-b dark:border-gray-800">
                <Link href="/" aria-label="Go to home">
                    <img
                        className="w-15 h-13 p-3 cursor-pointer select-none"
                        src={entry?.logo?.url}
                        alt="Home"
                        draggable={false}
                    />
                </Link>
            </SidebarHeader>

            {/* Sidebar content */}
            {/* Sidebar content */}
            <SidebarContent>
                {/* Contentstack Navigation */}
                <SidebarGroup>
                    <SidebarGroupContent className="mt-4">
                        <SidebarMenu>
                            {entry?.navigation_menu.map((item, idx) => {
                                const isActive = pathname === item.call_to_action.href;
                                return (
                                    <SidebarMenuItem key={idx}>
                                        <SidebarMenuButton
                                            asChild
                                            className={`flex items-center gap-2 transition-all duration-200
                  ${isActive
                                                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800"
                                                    : "text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#1b1b1f]"
                                                }`}
                                        >
                                            <Link href={item.call_to_action.href}>
                                                {iconMapper[item.icon] || <Search />}
                                                <span>{item.call_to_action.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}

                            {/* Admin Dropdown inside same SidebarGroupContent to remove gap */}
                            {hasAnyAdminAccess && (
                                <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
                                    <SidebarGroupLabel asChild className="mt-0">
                                        <CollapsibleTrigger
                                            className="w-full flex items-center justify-between gap-2 text-gray-800 dark:text-gray-200 
             hover:bg-gray-100 dark:hover:bg-[#1b1b1f] text-sm transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-2">
                                                <ShieldUser className="w-4 h-4" />
                                                Admin
                                            </div>
                                            <ChevronRight
                                                className={`ml-auto transition-transform duration-200 ${isAdminOpen ? "rotate-90" : ""}`}
                                            />
                                        </CollapsibleTrigger>

                                    </SidebarGroupLabel>

                                    <CollapsibleContent>
                                        <SidebarGroupContent className="mt-0">
                                            <SidebarMenu>
                                                {allowedAdminPages.map((page) => {
                                                    const isActive = pathname === page.href;
                                                    return (
                                                        <SidebarMenuItem key={page.title}>
                                                            <SidebarMenuButton
                                                                asChild
                                                                className={`flex items-center gap-2 transition-all duration-200
                            ${isActive
                                                                        ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800"
                                                                        : "text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#1b1b1f]"
                                                                    }`}
                                                            >
                                                                <Link href={page.href}>{page.title}</Link>
                                                            </SidebarMenuButton>
                                                        </SidebarMenuItem>
                                                    );
                                                })}
                                            </SidebarMenu>
                                        </SidebarGroupContent>
                                    </CollapsibleContent>
                                </Collapsible>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>


            {/* Footer */}
            <SidebarFooter className="border-t dark:border-gray-800">
                <ModeToggle />
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="dark:text-gray-200 dark:hover:bg-[#1b1b1f] flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full border-4 border-white dark:border-gray-900 shadow-xl overflow-hidden">
                                        <img
                                            src={signedAvatarUrl || "/DefaultProfile.png"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {user.username} <ChevronUp className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="w-[--radix-popper-anchor-width] dark:bg-[#18181b] dark:border-gray-800"
                            >
                                <AccountPageButton />
                                <SignOutButton />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
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
