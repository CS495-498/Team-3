import { createClient } from '@/utils/Supabase/server.js'
import { NextResponse } from 'next/server'
import { signupHandler } from './handler.js'
import { withLogging } from '@/utils/withLogging'

async function handlePost(request) {
    try {
        const { email, password } = await request.json()

        const supabase = await createClient()
        const emailRedirectTo = new URL(
            '/email-confirmed',
            process.env.NEXT_PUBLIC_APP_URL
        ).toString()

        const handler = signupHandler({
            signUp: (args) =>
                supabase.auth.signUp({
                    ...args,
                    options: { emailRedirectTo },
                }),
        })

        const result = await handler({ email, password })
        return NextResponse.json(result.body, { status: result.status })
    } catch {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export const POST = withLogging(handlePost)
