'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Loader2 } from 'lucide-react'

export default function SignInPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.replace('/dashboard')
    } else {
      setError('Wrong password')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1a' }}>
      <div className="w-full max-w-sm">
        <form onSubmit={submit} className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-5"
          style={{ boxShadow: '0 0 40px rgba(14,165,233,0.08)' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0ea5e9]/10 flex items-center justify-center border border-[#0ea5e9]/20">
              <Globe className="w-6 h-6 text-[#0ea5e9]" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-white tracking-tight">Fast Websites</h1>
              <p className="text-sm text-slate-500 mt-0.5">Lead dashboard</p>
            </div>
          </div>

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-[#0ea5e9]/60 w-full"
          />

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="flex items-center justify-center gap-2 py-2.5 bg-[#0ea5e9] text-black text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-[#38bdf8]"
            style={{ transition: 'background 0.15s' }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}
