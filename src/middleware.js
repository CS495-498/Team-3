import { updateSession } from '@/utils/Supabase/middleware.js'

export async function middleware(request) {
    // update user's auth session
    return await updateSession(request)
}

export const config = {
    matcher: ['/((?!api/forgot-password|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',]
    /*
 * Match all request paths except for the ones starting with:
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 * Feel free to modify this pattern to include more paths.
 */
}