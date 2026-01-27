'use client'

import { createClient } from '@/utils/Supabase/client.js'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
    const supabase = createClient()

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const router = useRouter()

    const handlePasswordReset = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        const { error } = await supabase.auth.resetPasswordForEmail(email);


        if (error) {
            setMessage('Error: ' + error.message)
        } else {
            setMessage('Check your email for the password reset instructions!')
            sessionStorage.setItem('pwreset_email', email.trim())
            router.push(`/login/reset-code`)

        }

        setLoading(false)
    }

    return (
        <div className="flex h-screen w-screen bg-white dark:bg-gray-900">
            <div className="relative w-1/2 flex items-center justify-center px-10 bg-white dark:bg-gray-900">
                <div className="w-full max-w-sm">
                    <h1 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">
                        Forgot Password?
                    </h1>

                    <p className="text-center text-gray-700 dark:text-gray-300 mb-6">
                        Enter your email and we'll send you a link to reset your password.
                    </p>

                    <form className="space-y-5" onSubmit={handlePasswordReset}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#88563b]"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#88563b] hover:bg-[#714830] text-white font-semibold py-2 rounded-md transition"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>

                    <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
                        Remember your password?{' '}
                        <a href="/login" className="text-[#88563b] font-semibold underline">
                            Back to Login
                        </a>
                    </p>

                    {message && (
                        <p className="mt-3 text-center text-sm text-green-600 dark:text-green-400">
                            {message}
                        </p>
                    )}
                </div>
            </div>

            <div className="w-1/2 h-full">
                <img
                    src="/red_panda_face.jpg"
                    alt="Red Panda"
                    className="w-full h-full object-cover"
                />
            </div>
        </div>
    )
}