'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/Supabase/client.js'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showRegister, setShowRegister] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(error.message)
    } else {
      localStorage.setItem("loginMessage", "Logged in");
      router.push('/') // redirect to homepage
    }

    setLoading(false)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Signup successful! Check your email to confirm your account.')
      setShowRegister(false) // optionally go back to login form
    }

    setLoading(false)
  }

  return (
    <div className="flex h-screen w-screen bg-white dark:bg-gray-900">

      <div className="relative w-1/2 flex items-center justify-center px-10 bg-white dark:bg-gray-900">
        <div className="w-full max-w-sm">

          {showRegister ? (
            <>
              <h1 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">
                Create Account
              </h1>

              <form className="space-y-5" onSubmit={handleSignUp}>
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#88563b]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#88563b] hover:bg-[#714830] text-white font-semibold py-2 rounded-md transition"
                >
                  {loading ? 'Signing up...' : 'Sign Up'}
                </button>
              </form>

              <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
                Already have an account?{' '}
                <button
                  onClick={() => setShowRegister(false)}
                  className="text-[#88563b] font-semibold underline"
                >
                  Login
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">
                Welcome Back
              </h1>

              <form className="space-y-5" onSubmit={handleLogin}>
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#88563b]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#88563b] hover:bg-[#714830] text-white font-semibold py-2 rounded-md transition"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
                Don't have an account?{' '}
                <button
                  onClick={() => setShowRegister(true)}
                  className="text-[#88563b] font-semibold underline"
                >
                  Sign Up
                </button>
              </p>

              <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
                <a href="/login/forgot-password" className="text-[#88563b] font-semibold underline">Forgot Password?</a>
              </p>
            </>
          )}

          {message && (
            <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">
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
