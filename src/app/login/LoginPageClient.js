'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SuccessToast from "@/components/ui/success-toast.jsx"

export default function LoginPageClient({ initialError, confirmed }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState("success")
  const [systemMessage, setSystemMessage] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formMessageType, setFormMessageType] = useState('error')

  useEffect(() => {
    const msg = localStorage.getItem("toastMessage")
    const type = localStorage.getItem("toastType") || "success"
    if (!msg) return

    setToastMessage(msg)
    setToastType(type)
    setShowToast(true)

    localStorage.removeItem("toastMessage")
    localStorage.removeItem("toastType")

    const timer = setTimeout(() => setShowToast(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (confirmed) {
      setFormMessageType('success')
      setFormMessage('Email confirmed. You can log in now.')
    }
  }, [confirmed])

  useEffect(() => {
    if (!initialError) return;

    if (initialError === "disabled") {
      setSystemMessage("Access for your organization has been disabled. Please contact your administrator.")
    }

    if (initialError === "unauthorized") {
      setSystemMessage("You don't have permission to access that page.")
    }

    window.history.replaceState({}, "", "/login")
  }, [initialError])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setFormMessage('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setFormMessageType('error')
        setFormMessage(data.error || 'Login failed')
      } else {
        localStorage.setItem("toastMessage", "Logged in")
        localStorage.setItem("toastType", "success")
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('Client-side error:', error)
      setFormMessageType('error')
      setFormMessage('An error occurred')
    }

    setLoading(false)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setFormMessage('')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setFormMessageType('error')
        setFormMessage(data.error || 'Signup failed')
      } else {
        setFormMessageType('success')
        setFormMessage('Signup successful! Check your email to confirm your account.')
        setShowRegister(false)
      }
    } catch (error) {
      setFormMessageType('error')
      setFormMessage('An error occurred')
    }

    setLoading(false)
  }

  return (
      <div className="flex h-screen w-screen bg-white dark:bg-gray-900">
        <div className="relative w-1/2 flex items-center justify-center px-10 bg-white dark:bg-gray-900">
          <div className="w-full max-w-sm">
            {showToast && (
                <SuccessToast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}

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
                    placeholder="********"
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
                    placeholder="********"
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
                <a href="/login/forgot-password" className="text-[#88563b] font-semibold underline">
                  Forgot Password?
                </a>
              </p>
            </>
          )}

          {systemMessage && (
            <div className="mt-4 rounded-md border border-red-300 bg-red-50 dark:bg-red-900/20 px-4 py-3">
              <p className="text-sm text-red-700 dark:text-red-300 text-center">
                {systemMessage}
              </p>
            </div>
          )}

          {formMessage && (
              <p
                  className={`mt-3 text-center text-sm ${
                      formMessageType === 'success'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                  }`}
              >
                {formMessage}
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