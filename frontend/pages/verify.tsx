import { useEffect, useState } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'

export default function VerifyPage() {
  const [status, setStatus] = useState<'idle'|'ok'|'error'|'resend_ok'|'resend_error'>('idle')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const u = new URL(window.location.href)
    const token = u.searchParams.get('token')
    if (token) {
      fetch(`/api/v1/auth/verify?token=${encodeURIComponent(token)}`)
        .then(async (r) => {
          if (r.ok) {
            const d = await r.json()
            setStatus('ok'); setMessage(d.message || 'Email verified')
          } else {
            const d = await r.json().catch(() => ({}))
            setStatus('error'); setMessage(d.detail || 'Invalid or expired token')
          }
        })
        .catch(() => { setStatus('error'); setMessage('Network error') })
    }
  }, [])

  const resend = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) { setStatus('resend_error'); setMessage('Please login or register first.'); return }
      const r = await fetch('/api/v1/auth/resend-verification', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      if (r.ok) { setStatus('resend_ok'); setMessage('Verification email sent') }
      else { const d = await r.json().catch(()=>({})); setStatus('resend_error'); setMessage(d.detail || 'Failed to resend') }
    } catch (e:any) {
      setStatus('resend_error'); setMessage(e?.message || 'Failed to resend')
    }
  }

  return (
    <>
      <Head><title>Email Verification</title></Head>
      <Layout>
        <div className="max-w-lg mx-auto">
          <div className="card">
            <h1 className="text-2xl font-semibold mb-3">Email Verification</h1>
            {status === 'idle' && (
              <p className="text-gray-300">Open this page using the link from your email, or resend a verification email below.</p>
            )}
            {status === 'ok' && (
              <div className="text-green-400">{message || 'Email verified!'} You can now <a href="/login" className="text-blue-400 underline">sign in</a>.</div>
            )}
            {status === 'error' && (
              <div className="text-red-400">{message || 'Invalid or expired token.'}</div>
            )}
            {(status === 'idle' || status === 'error' || status === 'resend_error' || status === 'resend_ok') && (
              <div className="mt-4 space-x-2">
                <button className="btn-primary" onClick={resend}>Resend Verification Email</button>
                <a className="btn-secondary" href="/login">Go to Login</a>
              </div>
            )}
            {status === 'resend_ok' && <div className="mt-2 text-sm text-gray-300">{message}</div>}
            {status === 'resend_error' && <div className="mt-2 text-sm text-red-400">{message}</div>}
          </div>
        </div>
      </Layout>
    </>
  )
}

