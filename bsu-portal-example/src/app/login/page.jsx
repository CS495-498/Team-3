'use client'

import { useState } from 'react'
import { createClient } from '@/utils/Supabase/server.js'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [showRegister, setShowRegister] = useState(false);


    const handleSignUp = async () => {
        const supabase = await createClient()
        setLoading(true)
        const {error} = await supabase.auth.signUp({email, password})
        setMessage(error ? error.message : 'Check your email to confirm signup')
        setLoading(false)
    }

    const handleLogin = async () => {
        const supabase = await createClient()
        setLoading(true)
        const {error} = await supabase.auth.signInWithPassword({email, password})
        setMessage(error ? error.message : 'Logged in!')
        setLoading(false)
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden relative bg-white">
            <div className="relative w-1/2 h-full overflow-hidden">
                <div
                    className={`flex h-full w-[200%] transition-transform duration-700 ease-in-out ${
                        showRegister ? "-translate-x-1/2" : "translate-x-0"
                    }`}
                >
                    <div className="w-1/2 flex flex-col justify-center items-center px-10">
                        <div className="w-full max-w-sm">
                            <h1 className="text-3xl font-bold text-center mb-4">
                                Welcome Back
                            </h1>
                            <p className="text-center text-gray-600 mb-6">
                                Don't have an account?{" "}
                                <button
                                    onClick={() => setShowRegister(true)}
                                    className="font-semibold text-black text-decoration-line: underline"
                                >
                                    Create an account
                                </button>
                            </p>

                            <form className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#88563b]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        onChange={e => setPassword(e.target.value)}
                                        value={password}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#88563b]"
                                    />
                                    <div className="text-right mt-1">
                                        <a
                                            href="#"
                                            className="text-sm text-gray-600 hover:underline"
                                        >
                                            Forgot password
                                        </a>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-[#88563b] hover:bg-[#714830] text-white font-semibold py-2 rounded-md transition"
                                    onClick={handleLogin}
                                >
                                    Login
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="w-1/2 flex flex-col justify-center items-center px-10">
                        <div className="w-full max-w-sm">
                            <h1 className="text-3xl font-bold text-center mb-2">
                                Begin Your Journey
                            </h1>
                            <p className="flex flex-col justify-center text-center text-gray-600 mb-8 mt-5">
                                <button
                                    type="button"
                                    onClick={() => setShowRegister(false)}
                                    className="inline-flex items-center justify-center gap-2 text-gray-600  transition-colors duration-200"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                         strokeWidth="1.5" stroke="currentColor" className="w-5 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
                                    </svg>

                                    Back to login
                                </button>
                            </p>

                            <form className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email address
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#88563b]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#88563b]"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    onClick={handleSignUp}
                                    className="w-full bg-[#88563b] hover:bg-[#714830] text-white font-semibold py-2 rounded-md transition"
                                >
                                    Register
                                </button>
                            </form>
                        </div>
                    </div>
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
