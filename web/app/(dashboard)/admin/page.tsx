'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Building2, FileText, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionUser {
  email?: string
  role?: string
}

function AdminLinkCard({
  title,
  description,
  icon: Icon,
  href,
  disabled = false,
}: {
  title: string
  description: string
  icon: React.ElementType
  href?: string
  disabled?: boolean
}) {
  const content = (
    <div
      className={cn(
        'rounded-lg border border-atc-border bg-white p-4 transition-colors',
        disabled && 'opacity-70',
        href && !disabled && 'hover:bg-atc-bg-subtle hover:border-atc-primary/30 cursor-pointer'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-atc-bg-subtle p-2 text-atc-primary">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading font-semibold text-atc-text">{title}</p>
          <p className="text-sm text-atc-text-muted mt-0.5">{description}</p>
          {disabled && (
            <p className="text-xs text-amber-600 mt-2">API not yet available</p>
          )}
        </div>
      </div>
    </div>
  )

  if (href && !disabled) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

export default function AdminPage() {
  const [session, setSession] = useState<SessionUser | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('user')
      if (raw) {
        const u = JSON.parse(raw) as SessionUser
        setSession({ email: u.email, role: u.role })
      }
    } catch {
      setSession(null)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-atc-text">Admin</h1>
        <p className="text-atc-text-muted mt-1 text-sm">
          User management, tenant settings, and system configuration. Options here
          depend on your role and available APIs.
        </p>
      </div>

      {/* Current session (read-only) */}
      <div className="rounded-lg border border-atc-border bg-white p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-atc-primary" />
          <p className="font-heading font-semibold text-atc-text">Current session</p>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-atc-text-muted">Email</dt>
            <dd className="font-medium text-atc-text">{session?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-atc-text-muted">Role</dt>
            <dd className="font-medium text-atc-text">{session?.role ?? '—'}</dd>
          </div>
        </dl>
      </div>

      {/* Admin sections hub */}
      <div>
        <p className="text-sm font-medium text-atc-text mb-3">Admin sections</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdminLinkCard
            title="User management"
            description="Invite users, assign roles, and manage access for your tenant."
            icon={Users}
            disabled
          />
          <AdminLinkCard
            title="Tenant settings"
            description="Company name, billing, and tenant-level configuration."
            icon={Building2}
            disabled
          />
          <AdminLinkCard
            title="Reports"
            description="AR Ledger, AP Ledger, and other reports."
            icon={FileText}
            href="/reports"
          />
        </div>
      </div>
    </div>
  )
}
