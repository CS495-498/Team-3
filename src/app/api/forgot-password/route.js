import { NextResponse } from 'next/server'
import { createClient } from '@/utils/Supabase/server.js'
import { forgotPasswordHandler } from './handler.js'
import { withLogging } from '@/utils/withLogging'

const store = new Map()

const handler = forgotPasswordHandler({
    store,
    resetPasswordForEmail: async (email) => {
        const supabase = await createClient()
        // Do NOT throw details to client; handler already swallows errors.
        await supabase.auth.resetPasswordForEmail(email)
    },
})

async function handlePost(req) {
    let email = ''
    try {
        const body = await req.json()
        email = body?.email || ''
    } catch { }

    const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()

    const result = await handler({ email, ip })
    return NextResponse.json(result.body, { status: result.status })
}

export const POST = withLogging(handlePost)
