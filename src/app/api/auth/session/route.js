import { createClient } from '@/utils/Supabase/server.js'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { session }, error } = await supabase.auth.getUser()

        if (error || !session) {
            return NextResponse.json({ session: null }, { status: 200 })
        }

        return NextResponse.json({ session })
    } catch (error) {
        console.error('Session fetch error:', error)
        return NextResponse.json({ session: null }, { status: 200 })
    }
}