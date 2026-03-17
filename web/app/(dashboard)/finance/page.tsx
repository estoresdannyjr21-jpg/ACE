'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Receipt, FileCheck, DollarSign, TrendingUp, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FinanceCounts {
  podVerifiedNotReceived: number
  docReceivedNotComputed: number
  billingReadyToBill: number
  billingBilled: number
  billingPaid: number
  payoutReadyForPayout: number
  payoutInBatch: number
  payoutFinMgrApproved: number
  payoutCfoApproved: number
  payoutReleased: number
  payoutPaid: number
  reimbursablesPendingApproval: number
  reimbursablesApprovedPendingBatch: number
  subconExpiringSoon: number
  subconExpiredBlocked: number
  overridesPendingCfo: number
}

interface FinanceDashboard {
  counts: FinanceCounts
  podVerifiedNotReceivedList: Array<{
    id: string
    internalRef: string
    runsheetDate: string
    assignedDriver?: { firstName: string; lastName: string }
  }>
  docReceivedNotComputedList: Array<{
    id: string
    internalRef: string
    runsheetDate: string
  }>
  overridesPendingList: Array<{
    id: string
    trip?: { id: string; internalRef: string; runsheetDate: string }
  }>
}

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  variant = 'default',
}: {
  title: string
  value: number
  icon: React.ElementType
  href?: string
  variant?: 'default' | 'warning' | 'success'
}) {
  const content = (
    <div
      className={cn(
        'rounded-lg border p-4 bg-white transition-colors',
        href && 'hover:bg-atc-bg-subtle cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-atc-text-muted">{title}</p>
          <p className="text-2xl font-heading font-bold text-atc-text mt-1">{value}</p>
        </div>
        <div
          className={cn(
            'p-3 rounded-lg',
            variant === 'warning' && 'bg-amber-50 text-amber-700',
            variant === 'success' && 'bg-emerald-50 text-atc-success',
            variant === 'default' && 'bg-atc-bg-alt text-atc-primary'
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
  if (href) return <Link href={href}>{content}</Link>
  return content
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dateTo = new Date()
    const dateFrom = new Date(dateTo)
    dateFrom.setDate(dateFrom.getDate() - 30)
    const query = {
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
    }
    api
      .get('/finance/dashboard', { params: query })
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load finance dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="w-10 h-10 rounded-full border-2 border-atc-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-atc-border bg-white p-6">
        <p className="text-atc-danger font-medium">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const { counts } = data

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-atc-text">Finance</h1>
          <p className="text-atc-text-muted mt-1">Dashboard and payables (last 30 days).</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports/ar-ledger">
            <span className="inline-flex items-center gap-2 rounded-lg border border-atc-border bg-white px-4 py-2 text-sm font-medium text-atc-text hover:bg-atc-bg-subtle">
              <FileText className="w-4 h-4" /> AR Ledger
            </span>
          </Link>
          <Link href="/reports/ap-ledger">
            <span className="inline-flex items-center gap-2 rounded-lg border border-atc-border bg-white px-4 py-2 text-sm font-medium text-atc-text hover:bg-atc-bg-subtle">
              <FileText className="w-4 h-4" /> AP Ledger
            </span>
          </Link>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-heading font-semibold text-atc-text mb-4">Document & billing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="POD verified, doc not received"
            value={counts.podVerifiedNotReceived}
            icon={Receipt}
            variant="warning"
          />
          <StatCard
            title="Doc received, not computed"
            value={counts.docReceivedNotComputed}
            icon={FileCheck}
            variant="warning"
          />
          <StatCard title="Ready to bill" value={counts.billingReadyToBill} icon={DollarSign} />
          <StatCard title="Billed" value={counts.billingBilled} icon={FileText} />
          <StatCard title="Paid (AR)" value={counts.billingPaid} icon={TrendingUp} variant="success" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-heading font-semibold text-atc-text mb-4">Payout</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Ready for payout"
            value={counts.payoutReadyForPayout}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard title="In batch" value={counts.payoutInBatch} icon={DollarSign} />
          <StatCard title="Fin Mgr approved" value={counts.payoutFinMgrApproved} icon={FileCheck} />
          <StatCard title="CFO approved" value={counts.payoutCfoApproved} icon={FileCheck} />
          <StatCard title="Released" value={counts.payoutReleased} icon={TrendingUp} />
          <StatCard title="Paid" value={counts.payoutPaid} icon={TrendingUp} variant="success" />
        </div>
      </section>

      {(counts.subconExpiringSoon > 0 || counts.subconExpiredBlocked > 0 || counts.overridesPendingCfo > 0) && (
        <section>
          <h2 className="text-lg font-heading font-semibold text-atc-text mb-4">Alerts</h2>
          <div className="flex flex-wrap gap-4">
            {counts.subconExpiringSoon > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                <AlertCircle className="w-4 h-4" />
                Subcontractor invoice deadline expiring soon: {counts.subconExpiringSoon}
              </div>
            )}
            {counts.subconExpiredBlocked > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
                <AlertCircle className="w-4 h-4" />
                Expired deadline (blocked): {counts.subconExpiredBlocked}
              </div>
            )}
            {counts.overridesPendingCfo > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-atc-border bg-atc-bg-alt px-4 py-2 text-sm text-atc-text">
                <AlertCircle className="w-4 h-4" />
                Override requests pending CFO: {counts.overridesPendingCfo}
              </div>
            )}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-atc-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-atc-text">POD verified, doc not received</h3>
          </div>
          {data.podVerifiedNotReceivedList.length === 0 ? (
            <p className="text-sm text-atc-text-muted">None</p>
          ) : (
            <ul className="space-y-2">
              {data.podVerifiedNotReceivedList.slice(0, 8).map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/trips/${t.id}`}
                    className="text-sm text-atc-primary hover:underline flex justify-between"
                  >
                    <span>{t.internalRef}</span>
                    <span className="text-atc-text-muted">{formatDate(t.runsheetDate)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-lg border border-atc-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-atc-text">Override requests (pending CFO)</h3>
          </div>
          {data.overridesPendingList.length === 0 ? (
            <p className="text-sm text-atc-text-muted">None</p>
          ) : (
            <ul className="space-y-2">
              {data.overridesPendingList.slice(0, 8).map((o) => (
                <li key={o.id}>
                  <Link
                    href={o.trip ? `/trips/${o.trip.id}` : '#'}
                    className="text-sm text-atc-primary hover:underline flex justify-between"
                  >
                    <span>{o.trip?.internalRef ?? '—'}</span>
                    <span className="text-atc-text-muted">
                      {o.trip?.runsheetDate ? formatDate(o.trip.runsheetDate) : '—'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
