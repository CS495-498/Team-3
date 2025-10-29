'use client'

import { useState } from 'react'
import { createClient } from '@/utils/Supabase/server.js'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const handleSignUp = async () => {
        const supabase = await createClient()
        setLoading(true)
        const { error } = await supabase.auth.signUp({ email, password })
        setMessage(error ? error.message : 'Check your email to confirm signup')
        setLoading(false)
    }

    const handleLogin = async () => {
        const supabase = await createClient()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        setMessage(error ? error.message : 'Logged in!')
        setLoading(false)
    }

    return (
        <div className="flex flex-col max-w-sm mx-auto mt-20">
            <h2 className="text-xl font-bold mb-4">Login or Sign Up</h2>
            <input
                className="border p-2 mb-2"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
            />
            <input
                className="border p-2 mb-2"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            <button className="bg-blue-600 text-white p-2 mb-2" onClick={handleLogin} disabled={loading}>
                Log In
            </button>
            <button className="bg-green-600 text-white p-2" onClick={handleSignUp} disabled={loading}>
                Sign Up
            </button>
            <p className="mt-4 text-sm text-gray-700">{message}</p>
        </div>
    )
}
