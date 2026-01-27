'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/Supabase/client.js'

const RESEND_COOLDOWN_SECONDS = 60

export default function ResetCodeClient() {
  const router = useRouter()

  const supabase = useMemo(() => createClient(), [])

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    const saved = sessionStorage.getItem('pwreset_email') || ''
    if (saved) setEmail(saved)
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  async function handleVerify(e) {
    e.preventDefault()
    setMessage('')
    setBusy(true)

    try {
      const cleanEmail = email.trim()
      const cleanCode = code.trim().replace(/\s+/g, '')

      if (!cleanEmail) {
        setMessage('Enter your email.')
        return
      }

      if (!/^\d{8}$/.test(cleanCode)) {
        setMessage('Enter the code from your email.')
        return
      }

      const { error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type: 'recovery',
      })

      if (error) {
        setMessage("Invalid or expired reset code.")
        return
      }

      router.push('/login/update-password')
    } finally {
      setBusy(false)
    }
  }

  async function handleResend() {
    setMessage('')
    setBusy(true)

    try {
      const cleanEmail = email.trim()
      if (!cleanEmail) {
        setMessage('Enter your email first.')
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail)

      if (error) {
        setMessage('Code sent (if that email exists). Check your inbox.')
        return
      }

      setMessage('Code sent (if that email exists). Check your inbox.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen w-screen bg-white dark:bg-gray-900 items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
          Enter reset code
        </h1>

        <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-300">
          We emailed you a 6-digit code. Enter it below to continue.
        </p>

        <form className="space-y-4 mt-6" onSubmit={handleVerify}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#88563b]"
              disabled={busy}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              6-digit code
            </label>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#88563b]"
              disabled={busy}
              required
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#88563b] hover:bg-[#714830] text-white font-semibold py-2 rounded-md transition disabled:opacity-70"
          >
            {busy ? 'Verifying…' : 'Verify code'}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={busy || cooldown > 0}
            className="w-full border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold py-2 rounded-md transition disabled:opacity-70"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>

          {message && (
            <p className="mt-2 text-center text-sm text-red-600 dark:text-red-400">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
