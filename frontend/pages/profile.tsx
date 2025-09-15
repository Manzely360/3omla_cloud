import Head from 'next/head'
import { useEffect, useState } from 'react'
import Layout from '../components/Layout'

export default function ProfilePage() {
  const [me, setMe] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchMe = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/v1/auth/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (res.ok) setMe(await res.json())
    } catch {}
  }
  useEffect(() => { fetchMe() }, [])

  const upload = async () => {
    if (!file) return
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/v1/auth/profile/avatar', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } as any : {}, body: fd })
      if (res.ok) { await fetchMe() }
    } finally { setLoading(false) }
  }

  return (
    <>
      <Head><title>Profile - Coin Matcher Engine v2</title></Head>
      <Layout>
        <div className="space-y-6 max-w-2xl mx-auto">
          <h1 className="text-2xl font-semibold">Profile</h1>
          {!me ? (
            <div className="card">
              <p className="text-gray-300">Please <a href="/login" className="text-primary-400">login</a> to manage your profile.</p>
            </div>
          ) : (
            <div className="card space-y-4">
              <div className="flex items-center space-x-4">
                {me.avatar_url ? <img src={me.avatar_url} alt="avatar" className="h-16 w-16 rounded-full object-cover" /> : <div className="h-16 w-16 rounded-full bg-gray-700" />}
                <div>
                  <div className="text-lg font-medium">{me.username || me.email}</div>
                  <div className="text-sm text-gray-400">{me.email}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Upload avatar</label>
                <input type="file" onChange={(e)=> setFile(e.target.files?.[0] || null)} className="text-sm" />
                <button className="btn-primary ml-3" onClick={upload} disabled={loading || !file}>{loading ? 'Uploading...' : 'Upload'}</button>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  )
}

