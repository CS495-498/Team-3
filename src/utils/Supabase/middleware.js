import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
    const { pathname } = request.nextUrl

    // Skip auth check for public API routes, login page, and Next.js internals
    if (
        pathname.startsWith('/api/auth/login') ||
        pathname.startsWith('/api/auth/signup') ||
        pathname.startsWith('/api/auth/session') ||
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

    const { data: { user }, error } = await supabase.auth.getUser()
    if (!pathname.startsWith('/login') && error) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user) {
        supabaseResponse.headers.set('x-user-id', user.id)
    }

    return supabaseResponse
}
