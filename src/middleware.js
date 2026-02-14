import { updateSession } from '@/utils/Supabase/middleware.js'
import { sanitizeUserAgent, sanitizeReferer } from '@/utils/sanitize.js'

export async function middleware(request) {
    const startTime = Date.now()

    const endpoint = request.nextUrl.pathname
    const method = request.method
    const sanitizedUserAgent = sanitizeUserAgent(request.headers.get('user-agent'))
    const sanitizedReferer = sanitizeReferer(request.headers.get('referer'))

    try {
        const response = await updateSession(request)

        // Only log page navigations from middleware; API routes are logged by withLogging wrapper
        if (!endpoint.startsWith('/api/')) {
            const statusCode = response.status
            const processingTime = Date.now() - startTime
            const userId = response.headers.get('x-user-id') || null

            let level = 'info'
            if (statusCode >= 400 && statusCode < 500) {
                level = 'warning'
            } else if (statusCode >= 500) {
                level = 'error'
            }

            fetch(`${request.nextUrl.origin}/api/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-log-secret': process.env.LOG_INGEST_SECRET || ''
                },
                body: JSON.stringify({
                    level,
                    endpoint,
                    status_code: statusCode,
                    message: `${method} ${endpoint}`,
                    user_id: userId,
                    metadata: {
                        method,
                        processing_time_ms: processingTime,
                        user_agent: sanitizedUserAgent,
                        referer: sanitizedReferer
                    }
                })
            }).catch(() => {
            })
        }

        return response
    } catch (error) {
        const processingTime = Date.now() - startTime

        fetch(`${request.nextUrl.origin}/api/logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-log-secret': process.env.LOG_INGEST_SECRET || ''
            },
            body: JSON.stringify({
                level: 'error',
                endpoint,
                status_code: 500,
                message: `${method} ${endpoint} - Error: ${error.message}`,
                user_id: null,
                metadata: {
                    method,
                    processing_time_ms: processingTime,
                    error_stack: error.stack,
                    user_agent: sanitizedUserAgent
                }
            })
        }).catch(() => {
            // Silently fail
        })

        throw error
    }
}

export const config = {
    matcher: ['/((?!api/logs|api/auth/session|api/forgot-password|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',]
    /*
 * Match all request paths except for the ones starting with:
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 * Feel free to modify this pattern to include more paths.
 */
}