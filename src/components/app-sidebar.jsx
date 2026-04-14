"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Calendar,
    ChevronRight,
    ChevronUp,
    Construction,
    Home,
    Inbox,
    Search,
    Settings,
    ShieldUser,
    TvMinimalPlay,
    User2,
} from "lucide-react";

import { useUser } from "@/context/UserContext";
import { hasPermission } from "@/utils/hasPermission";
import PERMISSIONS from "@/config/permissions";
import Stack, { onEntryChange } from "@/lib/cstack";
import SignOutButton from "./signout-button";
import AccountPageButton from "@/components/account-page-button.jsx";
import { useCurrentAvatar } from "@/hooks/use-current-avatar.js";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const iconMapper = {
    Home: Home,
    Inbox: Inbox,
    Calendar: Calendar,
    Settings: Settings,
    TvMinimalPlay: TvMinimalPlay,
    Search: Search,
    User2: User2,
    Construction: Construction,
};

const ADMIN_PAGES = [
    { title: "User Management", href: "/admin/usermanagement", permission: PERMISSIONS.MANAGE_USERS },
    { title: "Partner Management", href: "/admin/partnermanagement", permission: PERMISSIONS.MANAGE_PARTNERS },
    { title: "Logs", href: "/admin/logs", permission: PERMISSIONS.VIEW_LOGS },
    { title: "Metrics", href: "/admin/metrics", permission: PERMISSIONS.VIEW_METRICS },
];

const railButtonClass =
    "flex h-9 w-9 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#1b1b1f]";
const panelRowClass =
    "grid w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-[#1b1b1f]";
const labelMotionClass =
    "overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] max-w-48 opacity-100 translate-x-0";

function formatRole(role) {
    switch ((role || "").toLowerCase()) {
        case "admin":
            return "Admin";
        case "contentstack":
            return "Contentstack";
        case "partner":
            return "Partner";
        default:
            return "";
    }
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error(error, errorInfo);
    }

    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

function RailIconLink({ href, icon: Icon, label, active }) {
    return (
        <Link
            href={href}
            aria-label={label}
            title={label}
            className={cn(
                railButtonClass,
                active
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800"
                    : null
            )}
        >
            <Icon className="h-5 w-5" />
        </Link>
    );
}

function PanelNavLink({ href, label, active }) {
    return (
        <Link
            href={href}
            className={cn(
                panelRowClass,
                active
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800"
                    : "text-gray-800 dark:text-gray-200 dark:hover:bg-[#1b1b1f]"
            )}
        >
            <span className={labelMotionClass}>{label}</span>
        </Link>
    );
}

function PanelAdminSection({ allowedAdminPages, pathname, isAdminOpen, setIsAdminOpen }) {
    return (
        <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
            <CollapsibleTrigger
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#1b1b1f]"
                title="Admin"
            >
                <span className={labelMotionClass}>Admin</span>
                <ChevronRight className={cn("h-4 w-4 transition-transform", isAdminOpen ? "rotate-90" : null)} />
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="mt-1 space-y-1">
                    {allowedAdminPages.map((page) => {
                        const isActive = pathname === page.href;
                        return (
                            <Link
                                key={page.title}
                                href={page.href}
                                className={cn(
                                    "block whitespace-nowrap rounded-md px-2 py-2 text-sm transition-colors",
                                    isActive
                                        ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800"
                                        : "text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#1b1b1f]"
                                )}
                            >
                                {page.title}
                            </Link>
                        );
                    })}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

function PanelAccount({ avatarSrc, username }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#1b1b1f]"
                >
                    <span className="h-10 w-10 overflow-hidden rounded-full border-4 border-white shadow-xl dark:border-gray-900">
                        <img src={avatarSrc} className="h-full w-full object-cover" />
                    </span>
                    <span className={labelMotionClass}>{username ?? "Username"}</span>
                    <ChevronUp className="ml-auto h-4 w-4" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width] dark:border-gray-800 dark:bg-[#18181b]">
                <AccountPageButton />
                <SignOutButton />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function DesktopSidebar({
    entry,
    pathname,
    allowedAdminPages,
    hasAnyAdminAccess,
    isAdminOpen,
    setIsAdminOpen,
    avatarSrc,
    username,
    role,
}) {
    const [expanded, setExpanded] = useState(false);
    const [railAvatarOpacity, setRailAvatarOpacity] = useState(1);
    const hoverTimeoutRef = useRef(null);
    const railAvatarOpacityRef = useRef(1);

    const navItems = entry?.navigation_menu ?? [];
    const side = entry?.side_of_screen === "right" ? "right" : "left";
    const roleLabel = formatRole(role);

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        let frameId = 0;
        let startTime = 0;
        const duration = 280;
        const from = railAvatarOpacityRef.current;
        const to = expanded ? 0 : 1;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const nextOpacity = from + (to - from) * eased;

            railAvatarOpacityRef.current = nextOpacity;
            setRailAvatarOpacity(nextOpacity);

            if (progress < 1) {
                frameId = window.requestAnimationFrame(step);
            }
        };

        frameId = window.requestAnimationFrame(step);

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [expanded]);

    const queueOpen = () => {
        if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = window.setTimeout(() => {
            setExpanded(true);
            hoverTimeoutRef.current = null;
        }, 80);
    };

    const queueClose = () => {
        if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = window.setTimeout(() => {
            setExpanded(false);
            hoverTimeoutRef.current = null;
        }, 90);
    };

    return (
        <aside
            className={cn("fixed inset-y-0 z-40 hidden md:block", side === "right" ? "right-0" : "left-0")}
            style={{ width: "var(--sidebar-width-icon, 2.5rem)" }}
            onMouseEnter={queueOpen}
            onMouseLeave={queueClose}
            onFocusCapture={() => {
                if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
                setExpanded(true);
            }}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) queueClose();
            }}
        >
            <div className="relative h-full">
                <div className="absolute inset-y-0 left-0 z-10 flex h-full w-[var(--sidebar-width-icon)] flex-col items-center border-r bg-white py-2 dark:border-gray-800 dark:bg-[#0f0f11]">
                    <Link href="/" aria-label="Go to home" className="mb-4 flex h-12 w-full items-center justify-center">
                        <img
                            className="h-12 w-20 p-2 select-none"
                            src={entry?.logo?.url}
                            alt="Home"
                            draggable={false}
                        />
                    </Link>

                    <div className="flex flex-1 flex-col items-center gap-1">
                        {navItems.map((item, idx) => {
                            const Icon = iconMapper[item.icon] || Search;
                            return (
                                <RailIconLink
                                    key={`${item.call_to_action.href}-${idx}`}
                                    href={item.call_to_action.href}
                                    icon={Icon}
                                    label={item.call_to_action.title}
                                    active={pathname === item.call_to_action.href}
                                />
                            );
                        })}

                        {hasAnyAdminAccess && (
                            <button
                                type="button"
                                title="Admin"
                                aria-label="Admin"
                                className={railButtonClass}
                                onClick={() => setExpanded(true)}
                            >
                                <ShieldUser className="h-[1.35rem] w-[1.35rem]" />
                            </button>
                        )}
                    </div>

                    <div className="mt-auto flex flex-col items-center gap-2">
                        <ModeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    title={username ?? "Account"}
                                    aria-label={username ?? "Account"}
                                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-xl hover:bg-gray-100 dark:border-gray-900 dark:hover:bg-[#1b1b1f]"
                                    style={{
                                        opacity: railAvatarOpacity,
                                    }}
                                >
                                    <img src={avatarSrc} className="h-full w-full object-cover" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" className="dark:border-gray-800 dark:bg-[#18181b]">
                                <AccountPageButton />
                                <SignOutButton />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div
                    className={cn(
                        "absolute inset-y-0 z-0 overflow-hidden border-r bg-white shadow-xl dark:border-gray-800 dark:bg-[#0f0f11]",
                        expanded ? "pointer-events-auto" : "pointer-events-none"
                    )}
                    style={{
                        left: "var(--sidebar-width-icon, 2.75rem)",
                        width: "calc(var(--sidebar-width, 16rem) - var(--sidebar-width-icon, 2.75rem))",
                        maxWidth: expanded
                            ? "calc(var(--sidebar-width, 16rem) - var(--sidebar-width-icon, 2.75rem))"
                            : "0px",
                        opacity: expanded ? 1 : 0.98,
                        transition:
                            "max-width 280ms cubic-bezier(0.16,1,0.3,1), opacity 180ms cubic-bezier(0.16,1,0.3,1)",
                    }}
                >
                    <div
                        className="flex h-full flex-col"
                        style={{
                            opacity: expanded ? 1 : 0,
                            transform: expanded ? "translateX(0)" : "translateX(-8px)",
                            transition:
                                "opacity 160ms cubic-bezier(0.16,1,0.3,1), transform 280ms cubic-bezier(0.16,1,0.3,1)",
                        }}
                    >
                        <div className="flex h-16 items-center border-b px-3 dark:border-gray-800">
                            {roleLabel ? (
                                <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80 dark:border-gray-700 dark:bg-[#18181b] dark:text-gray-200">
                                    {roleLabel}
                                </span>
                            ) : null}
                        </div>

                        <div className="flex-1 overflow-auto px-1 py-3">
                            <div className="space-y-1">
                                {navItems.map((item, idx) => (
                                    <PanelNavLink
                                        key={`${item.call_to_action.href}-panel-${idx}`}
                                        href={item.call_to_action.href}
                                        label={item.call_to_action.title}
                                        active={pathname === item.call_to_action.href}
                                    />
                                ))}

                                {hasAnyAdminAccess && (
                                    <PanelAdminSection
                                        allowedAdminPages={allowedAdminPages}
                                        pathname={pathname}
                                        isAdminOpen={isAdminOpen}
                                        setIsAdminOpen={setIsAdminOpen}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="border-t px-1 py-2 dark:border-gray-800">
                            <PanelAccount avatarSrc={avatarSrc} username={username} />
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export function AppSidebar() {
    const [entry, setEntry] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const [isAdminOpen, setIsAdminOpen] = useState(true);
    const isMobile = useIsMobile();

    const { user, loading } = useUser();
    const { signedAvatarUrl } = useCurrentAvatar(user);
    const avatarSrc = signedAvatarUrl ? signedAvatarUrl : "/DefaultProfile.png";

    useEffect(() => {
        async function getContent() {
            const res = await Stack.getElementByTypeWithRefs("header", "en-us", []);
            setEntry(res?.[0]?.[0] || {});
            setIsLoading(false);
        }
        onEntryChange(getContent);
        getContent();
    }, []);

    if (loading || !user || isLoading || isMobile) return null;

    const allowedAdminPages = ADMIN_PAGES.filter((page) =>
        hasPermission(user.role, page.permission)
    );

    return (
        <ErrorBoundary>
            <DesktopSidebar
                entry={entry}
                pathname={pathname}
                allowedAdminPages={allowedAdminPages}
                hasAnyAdminAccess={allowedAdminPages.length > 0}
                isAdminOpen={isAdminOpen}
                setIsAdminOpen={setIsAdminOpen}
                avatarSrc={avatarSrc}
                username={user?.username}
                role={user?.role}
            />
        </ErrorBoundary>
    );
}
