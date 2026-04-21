import { createClient, createServiceRoleClient } from '@/utils/Supabase/server.js'
import { NextResponse } from 'next/server'
import { signupHandler } from './handler.js'
import { withLogging } from '@/utils/withLogging'

async function handlePost(request) {
    try {
        const { email, password, full_name, username } = await request.json()

        // Server-side validation for new fields
        if (!full_name || !full_name.trim()) {
            return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
        }
        if (!username || username.trim().length < 3) {
            return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
        }

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

        if (result.status !== 200) {
            return NextResponse.json(result.body, { status: result.status })
        }

        // Update the auto-created profile row with full_name and username.
        // Uses service role client to bypass RLS since the user has no session yet.
        const userId = result.body.userId
        if (userId) {
            const serviceClient = await createServiceRoleClient()
            const { error: profileError } = await serviceClient
                .from('profiles')
                .update({
                    full_name: full_name.trim(),
                    username: username.trim(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)

            if (profileError) {
                const isUniqueViolation = profileError.code === '23505'
                return NextResponse.json(
                    { error: isUniqueViolation ? 'Username is already taken.' : 'Failed to save profile.' },
                    { status: 400 }
                )
            }
        }

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (err) {
        console.error('[signup] Internal error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export const POST = withLogging(handlePost)
