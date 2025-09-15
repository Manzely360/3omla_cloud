import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { login, register, resendVerification } from '../lib/auth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = isRegister
        ? await register(email, password, username || undefined)
        : await login(email, password)
      localStorage.setItem('auth_token', res.access_token)
      toast.success(isRegister ? 'Registered' : 'Logged in')
      router.push('/')
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Auth error'
      if (detail === 'Email not verified') {
        toast.error('Please verify your email. Check your inbox or resend below.')
      } else {
        toast.error(detail)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      const res = await resendVerification()
      toast.success(res?.message || 'Sent!')
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e?.message || 'Failed to resend')
    }
  }

  return (
    <>
      <Head><title>{isRegister ? 'Register' : 'Login'} - Crypto Radar</title></Head>
      <Layout>
        <div className="max-w-md mx-auto">
          <div className="card">
            <h1 className="text-2xl font-semibold mb-4">{isRegister ? 'Create Account' : 'Sign In'}</h1>
            <form onSubmit={handleSubmit} className="space-y-3">
              {isRegister && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Username</label>
                  <input className="input" value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Optional" />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email</label>
                <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Password</label>
                <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
              </div>
              <button className="btn-primary w-full" disabled={loading}>
                {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
              </button>
            </form>
            <div className="text-sm text-gray-400 mt-3">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button className="text-primary-400" onClick={()=>setIsRegister(!isRegister)}>
                {isRegister ? 'Sign in' : 'Create one'}
              </button>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Didn't get a verification email? <a className="text-primary-400" href="/verify">Verify</a> or <button type="button" className="text-primary-400" onClick={handleResend}>Resend</button>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
