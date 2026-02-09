/**
 * Sanitizes a string for safe storage and display.
 * - Strips HTML tags
 * - Removes control characters
 * - Encodes HTML entities
 * - Limits length
 */
export function sanitizeHeaderValue(input, maxLength = 500) {
    if (input == null) {
        return null
    }

    let sanitized = String(input)

    sanitized = sanitized.replace(/<[^>]*>/g, '')

    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')

    sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')

    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength)
    }

    return sanitized
}


export function sanitizeUserAgent(userAgent) {
    return sanitizeHeaderValue(userAgent, 500)
}


export function sanitizeReferer(referer) {
    if (referer == null) {
        return null
    }

    try {
        const url = new URL(referer)
        if (!['http:', 'https:'].includes(url.protocol)) {
            return null
        }
        return sanitizeHeaderValue(url.href, 2000)
    } catch {
        return null
    }
}
