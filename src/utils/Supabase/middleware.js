import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import ROLE_PERMISSIONS from "@/config/rolePermissions";
import PERMISSIONS from "@/config/permissions";

export async function updateSession(request) {
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
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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
    const user = await supabase.auth.getUser()
    if (!request.nextUrl.pathname.startsWith('/login') && user.error) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
      // 👇 Stop here if not logged in
  if (!user) return supabaseResponse;

  // -------------------------
  // 2. AUTHORIZATION (new)
  // -------------------------
  const pathname = request.nextUrl.pathname;

  // Only guard protected sections
  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const permissions = ROLE_PERMISSIONS[profile?.role] || [];

    if (!permissions.includes(PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.redirect(
        new URL("/unauthorized", request.url)
      );
    }
  }


    return supabaseResponse
}