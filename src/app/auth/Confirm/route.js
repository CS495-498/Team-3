import { NextResponse } from 'next/server'
import { createClient } from '@/utils/Supabase/server.js'

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    const redirectTo = request.nextUrl.clone()
    redirectTo.pathname = '/login'
    redirectTo.searchParams.delete('token_hash')
    redirectTo.searchParams.delete('type')

    if (token_hash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })

        if (!error) {
            redirectTo.searchParams.set('confirmed', '1')
            return NextResponse.redirect(redirectTo)
        }
    }

    redirectTo.pathname = '/login'
    redirectTo.searchParams.set('error', 'confirmation_failed')
    return NextResponse.redirect(redirectTo)
}