import AccountPage from '@/app/account/account-page.jsx'
import { createClient } from '@/utils/Supabase/server.js'

export default async function Account() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    return <AccountPage user={user} />
}