import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000'

export async function login(email: string, password: string) {
  const res = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, { email, password })
  return res.data
}

export async function register(email: string, password: string, username?: string) {
  const res = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, { email, password, username })
  return res.data
}

export async function resendVerification() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (!token) throw new Error('Not authenticated')
  const res = await axios.post(`${API_BASE_URL}/api/v1/auth/resend-verification`, {}, { headers: { Authorization: `Bearer ${token}` } })
  return res.data
}
