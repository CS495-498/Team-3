import { Calendar, ChevronUp, Home, Inbox, Search, Settings, TvMinimalPlay, User2, ChevronsLeftRightEllipsis, Construction } from "lucide-react"
import Link from "next/link";
import { usePathname } from "next/navigation";

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
import SignOutButton from "./signout-button";
import AccountPageButton from "@/components/account-page-button.jsx";
import {createClient} from "../utils/Supabase/client.js";
import {useCurrentAvatar} from "@/hooks/use-current-avatar.js";

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
    const pathname = usePathname();
    const supabase = createClient();


    const getContent = async () => {
        const entry = await Stack.getElementByTypeWithRefs("header", "en-us", []);
        setEntry(entry[0][0]);
        console.log("Sidebar Entry:", entry);
        setIsLoading(false);
    };

    const [user, setUser] = useState(null)
    const usernamePlaceHolder = {
        username: "Username",
    }
    const { signedAvatarUrl } = useCurrentAvatar(user);



    useEffect(() => {
        const fetchUsername = async () => {
            setIsLoading(true);
            const {data: { user }, error: userError,} = await supabase.auth.getUser()
            if (userError || !user) {
                console.error('No logged-in user:', userError)
                setIsLoading(false)
            }
            setUser(user);
            try {
                const { data, error } = await supabase.from('profiles').select('username').eq('id', user.id).single()
                if (error) throw error

                if (data){
                    setUser({username: data.username ?? 'Username'})
                } else {
                    setUser(usernamePlaceHolder)
                }
                setIsLoading(false)

            } catch (err) {
                console.error('Error loading user data:', err)
                alert('Error loading user data!')
            } finally {
                setIsLoading(false)
            }
        }
        onEntryChange(getContent);
        fetchUsername()
    }, []);


    if (isLoading)
        return (
            <SidebarMenu>
                {Array.from({length: 5}).map((_, index) => (
                    <SidebarMenuItem key={index}>
                        <SidebarMenuSkeleton showIcon/>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        );


    return (
    <Sidebar
        side={entry?.side_of_screen}
        collapsible="none"
        className="dark:bg-[#0f0f11] bg-white transition-colors"
    >
        {/* Header */}
        <SidebarHeader className="p-0 mb-0 border-b dark:border-gray-800">
            <Link
                href="/"
                aria-label="Go to home"
                className="inline-flex items-center justify-start"
            >
                <img
                    className="w-15 h-13 p-3 cursor-pointer select-none"
                    src={entry?.logo?.url}
                    alt="Home"
                    draggable="false"
                />
            </Link>
        </SidebarHeader>

        {/* Sidebar content */}
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupContent className="mt-4">
                    <SidebarMenu>
                        {entry?.navigation_menu.map((item, index) => {
                            const isActive = pathname === item.call_to_action.href;

                            return (
                                <SidebarMenuItem key={index}>
                                    <SidebarMenuButton
                                        asChild
                                        className={`
                                            flex items-center gap-2 transition-all duration-200

                                            /* Light mode */
                                            ${isActive
                                                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800"
                                                : "text-gray-800 hover:bg-gray-100"
                                            }

                                            /* Dark mode improved */
                                            dark:text-gray-200
                                            dark:hover:bg-[#1b1b1f]
                                            dark:hover:text-white
                                            ${isActive && "dark:bg-purple-700 dark:text-white dark:hover:bg-purple-800"}
                                        `}
                                    >
                                        <Link href={item.call_to_action.href}>
                                            {iconMapper[item.icon] || <Search />}
                                            <span>{item.call_to_action.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t dark:border-gray-800">
            <ModeToggle />
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                className="
                                    dark:text-gray-200 
                                    dark:hover:bg-[#1b1b1f]
                                "
                            >
                                <div className="w-10 h-10 rounded-full border-4 border-white dark:border-gray-900 shadow-xl overflow-hidden">{
                                    <img
                                        src={signedAvatarUrl ? signedAvatarUrl : "/DefaultProfile.png"}
                                        className="w-full h-full object-cover"
                                    />
                                }</div>{user?.username ?? "Username"} <ChevronUp className="ml-auto" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            side="top"
                            className="
                                w-[--radix-popper-anchor-width]
                                dark:bg-[#18181b]
                                dark:border-gray-800
                            "
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
  )
}