import { NextResponse } from 'next/server'
import { createClient } from '@/utils/Supabase/server.js'
import { forgotPasswordHandler } from './handler.js'

const store = new Map()

const handler = forgotPasswordHandler({
    store,
    resetPasswordForEmail: async (email) => {
        const supabase = await createClient()
        // Do NOT throw details to client; handler already swallows errors.
        await supabase.auth.resetPasswordForEmail(email)
    },
})

export async function POST(req) {
    let email = ''
    try {
        const body = await req.json()
        email = body?.email || ''
    } catch { }

    const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()

    const result = await handler({ email, ip })
    return NextResponse.json(result.body, { status: result.status })
}
