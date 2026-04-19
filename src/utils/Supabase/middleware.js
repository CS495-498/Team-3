import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import ROLE_PERMISSIONS from "@/config/rolePermissions";
import PERMISSIONS from "@/config/permissions";

export async function updateSession(request) {
    const { pathname } = request.nextUrl

    // Skip auth check for public API routes, login page, and Next.js internals
    if (
        pathname.startsWith('/api/auth/login') ||
        pathname.startsWith('/api/auth/signup') ||
        pathname.startsWith('/api/auth/session') ||
        pathname.startsWith('/auth/Confirm') ||
        pathname.startsWith('/auth/Signout') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/_next/')
    ) {
        return NextResponse.next()
    }

    // Create a mutable copy of cookies that setAll can update
    // This ensures getAll sees updated tokens after a refresh
    let currentCookies = request.cookies.getAll()

    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        {
            cookies: {
                getAll() {
                    return currentCookies
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        currentCookies = currentCookies.filter(c => c.name !== name)
                        currentCookies.push({ name, value })
                        request.cookies.set(name, value)
                    })
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // refreshing the auth token

    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user || authError) return NextResponse.redirect(new URL("/login", request.url));

    const emailDomain = user.email.split("@")[1];

    const { data: domainRecord } = await supabase
        .from("signup_email_domains")
        .select("active")
        .eq("domain", emailDomain)
        .single();

    if (!domainRecord?.active) {
        // Sign them out immediately
        return NextResponse.redirect(new URL("/login?error=disabled", request.url));
    }

    // Optional: add user id header
    const response = NextResponse.next();
    response.headers.set("x-user-id", user.id);

    // -------------------------
    // Dynamic Authorization
    // -------------------------
    const ROUTE_PERMISSIONS = [
        { path: "/admin/usermanagement", permission: PERMISSIONS.MANAGE_USERS },
        { path: "/admin/partnermanagement", permission: PERMISSIONS.MANAGE_PARTNERS },
        { path: "/admin/logs", permission: PERMISSIONS.VIEW_LOGS },
        { path: "/admin/metrics", permission: PERMISSIONS.VIEW_METRICS },
    ];

    const matchedRoute = ROUTE_PERMISSIONS.find(route => pathname.startsWith(route.path));
    if (matchedRoute) {
        const { permission } = matchedRoute;

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) return NextResponse.redirect(new URL("/unauthorized", request.url));

        const userPermissions = ROLE_PERMISSIONS[profile.role] || [];
        if (!userPermissions.includes(permission)) {
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
    }

    return response;
}
