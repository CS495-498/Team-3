import { NextResponse } from 'next/server'
import { createClient } from '@/utils/Supabase/server.js'

const store = new Map()
// key -> { count: number, resetAt: number }

const LIMIT = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function isAllowed(key) {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + WINDOW_MS })
        return true
    }

    if (entry.count >= LIMIT) return false
    entry.count += 1
    return true
}

export async function POST(req) {
    console.log('[forgot-password] route hit')

    let email = ''
    try {
        const body = await req.json()
        email = (body?.email || '').trim()
    } catch { }

    // Rate limit by IP + email
    const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
    const key = `${ip}:${email.toLowerCase()}`

    // Always return the same message to prevent email enumeration
    const generic = { message: 'If that email exists, we sent reset instructions.' }

    if (!email) return NextResponse.json(generic, { status: 200 })

    if (!isAllowed(key)) {
        return NextResponse.json(generic, { status: 200 })
    }

    try {
        const supabase = await createClient()
        await supabase.auth.resetPasswordForEmail(email)
    } catch {
        // swallow errors to avoid leaking info
    }

    return NextResponse.json(generic, { status: 200 })
}
