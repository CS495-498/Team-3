// src/app/api/public/login/route.js
import { createClient } from '@/utils/Supabase/server.js'
import { NextResponse } from 'next/server'
import { loginHandler } from './handler.js'

export async function POST(request) {
    try {
        const { email, password } = await request.json()

        const supabase = await createClient()

        const handler = loginHandler({
            signInWithPassword: (args) => supabase.auth.signInWithPassword(args),
        })

        const result = await handler({ email, password })
        return NextResponse.json(result.body, { status: result.status })
    } catch (error) {
        console.error('Route handler error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
