'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/Supabase/client.js'

const RESEND_COOLDOWN_SECONDS = 60

export default function ResetCodeClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const supabase = useMemo(() => createClient(), [])

  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

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

      if (!/^\d{6,8}$/.test(cleanCode)) {
        setMessage('Enter the code from your email.')
        return
      }

      const { error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type: 'recovery',
      })

      if (error) {
        setMessage(error.message)
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

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/Confirm?next=/login/update-password`,
      })

      if (error) {
        setMessage(error.message)
        return
      }

      setMessage('Code sent (if that email exists). Check your inbox.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } finally {
      setBusy(false)
    }
  }

  return (
    // ⬅️ your JSX exactly as-is
    <div className="flex min-h-screen w-screen bg-white dark:bg-gray-900 items-center justify-center px-6">
      {/* ...unchanged UI... */}
    </div>
  )
}
