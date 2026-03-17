'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    if (searchParams.get('session') === 'expired') {
      setSessionExpired(true)
      // Clear query so message doesn't persist on refresh
      router.replace('/login', { scroll: false })
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSessionExpired(false)
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { email, password })
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      router.push('/dashboard')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string }; status?: number }; message?: string; code?: string }
      const msg = ax.response?.data?.message ?? null
      const status = ax.response?.status
      if (status === 401) {
        setError(msg || 'Invalid email or password.')
      } else if (!ax.response && (ax.message === 'Network Error' || ax.code === 'ERR_NETWORK')) {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        setError(`Cannot reach the API at ${base}. Is the API running?`)
      } else {
        setError(msg || ax.message || `Login failed${status ? ` (${status})` : ''}.`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-atc-bg-subtle">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-atc-border shadow-sm p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-heading font-bold text-atc-primary">
              Ace Truckers Corp
            </h1>
            <p className="text-atc-text-muted mt-2">Sign in to your account</p>
          </div>

          {sessionExpired && (
            <div className="mb-4 p-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
              Your session expired. Please sign in again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@acetruckers.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-atc-danger bg-red-50 border border-red-100 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
