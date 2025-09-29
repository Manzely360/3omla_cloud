import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

const client = axios.create({
  baseURL: API_BASE_URL || undefined,
})

export async function login(email: string, password: string) {
  const res = await client.post('/api/v1/auth/login', { email, password })
  return res.data
}

export interface RegisterPayload {
  email: string
  password: string
  first_name: string
  last_name: string
  username?: string
  phone_country_code: string
  phone_number: string
  language?: string
}

export async function register(payload: RegisterPayload) {
  const res = await client.post('/api/v1/auth/register', payload)
  return res.data
}

export async function resendVerification() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (!token) throw new Error('Not authenticated')
  const res = await client.post('/api/v1/auth/resend-verification', {}, { headers: { Authorization: `Bearer ${token}` } })
  return res.data
}
