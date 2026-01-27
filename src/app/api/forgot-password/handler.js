// Pure handler logic (easy to unit test)
export function forgotPasswordHandler({
    limit = 5,
    windowMs = 15 * 60 * 1000,
    store = new Map(),
    now = () => Date.now(),
    resetPasswordForEmail, // async (email) => { error? } or throws
    normalizeEmail = (e) => (e || '').trim().toLowerCase(),
} = {}) {
    if (!resetPasswordForEmail) {
        throw new Error('resetPasswordForEmail is required')
    }

    const generic = { message: 'If that email exists, we sent reset instructions.' }

    function isAllowed(key) {
        const t = now()
        const entry = store.get(key)
        if (!entry || t > entry.resetAt) {
            store.set(key, { count: 1, resetAt: t + windowMs })
            return true
        }
        if (entry.count >= limit) return false
        entry.count += 1
        return true
    }

    return async function handle({ email, ip = 'unknown' }) {
        const cleanEmail = normalizeEmail(email)
        const key = `${ip}:${cleanEmail}`

        // Always return generic (no email enumeration)
        if (!cleanEmail) return { status: 200, body: generic }

        if (!isAllowed(key)) return { status: 200, body: generic }

        try {
            await resetPasswordForEmail(cleanEmail)
        } catch {
            // swallow to avoid leaking system/account info
        }

        return { status: 200, body: generic }
    }
}
