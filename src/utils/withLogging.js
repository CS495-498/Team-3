import logger from '@/utils/logger.js'
import { sanitizeUserAgent, sanitizeReferer } from '@/utils/sanitize.js'

export function withLogging(handler) {
    return async function loggedHandler(req, context) {
        const startTime = Date.now()
        const endpoint = req.nextUrl?.pathname || req.url || 'unknown'
        const method = req.method || 'UNKNOWN'
        const headers = req.headers || {}
        const getHeader = typeof headers.get === 'function' ? (k) => headers.get(k) : (k) => headers[k]
        const sanitizedUserAgent = sanitizeUserAgent(getHeader('user-agent'))
        const sanitizedReferer = sanitizeReferer(getHeader('referer'))
        const userId = getHeader('x-user-id') || null

        try {
            const response = await handler(req, context)
            const statusCode = response.status
            const processingTime = Date.now() - startTime

            let level = 'info'
            if (statusCode >= 400 && statusCode < 500) {
                level = 'warning'
            } else if (statusCode >= 500) {
                level = 'error'
            }

            logger.log({
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

            return response
        } catch (error) {
            const processingTime = Date.now() - startTime

            logger.log({
                level: 'error',
                endpoint,
                status_code: 500,
                message: `${method} ${endpoint} - Error: ${error.message}`,
                user_id: userId,
                metadata: {
                    method,
                    processing_time_ms: processingTime,
                    error_stack: error.stack,
                    user_agent: sanitizedUserAgent
                }
            })

            throw error
        }
    }
}
