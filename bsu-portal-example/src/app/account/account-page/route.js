import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/Supabase/server.js'

export async function GET(req, res) {
    const supabase = await createClient();

    const {
        data: { user, error },
    } = await supabase.auth.getUser();

    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
}