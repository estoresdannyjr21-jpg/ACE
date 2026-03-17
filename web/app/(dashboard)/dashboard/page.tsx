'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import {
  AlertTriangle,
  FileCheck,
  Clock,
  DollarSign,
  Receipt,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type UserRole = string

const OPS_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'OPERATIONS_ACCOUNT_COORDINATOR',
]
const FINANCE_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'FINANCE_PERSONNEL',
  'FINANCE_MANAGER',
  'CFO',
]

interface OperationsCounts {
  pendingAcceptance: number
  acceptedOngoing: number
  completed: number
  podUploadedPendingReview: number
  podRejected: number
  podVerified: number
  financeDocReceived: number
  noUpdateCallTime: number
}

interface OperationsDashboard {
  counts: OperationsCounts
  pendingAcceptanceTrips: Array<{
    id: string
    internalRef: string
    runsheetDate: string
    callTime: string
    assignmentStatus: string
    assignedDriver?: { firstName: string; lastName: string }
  }>
  noUpdateCallTimeTrips: Array<{
    id: string
    internalRef: string
    callTime: string
    lastDriverEventAt: string | null
  }>
  openIncidents: Array<{
    id: string
    tripId: string
    incidentType: string
    severity: string
    status: string
    description: string | null
    reportedAt: string
    trip?: { internalRef: string }
  }>
}

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
          <p className="text-2xl font-heading font-bold text-atc-text mt-1">
            {value}
          </p>
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
  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

function formatDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [opsData, setOpsData] = useState<OperationsDashboard | null>(null)
  const [financeData, setFinanceData] = useState<FinanceDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!userStr) return
    const user = JSON.parse(userStr)
    setUserRole(user.role)

    const dateTo = new Date()
    const dateFrom = new Date(dateTo)
    dateFrom.setDate(dateFrom.getDate() - 30)
    const query = {
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
    }

    Promise.all([
      OPS_ROLES.includes(user.role)
        ? api.get('/dispatch/dashboard/operations', { params: query }).then((r) => r.data)
        : Promise.resolve(null),
      FINANCE_ROLES.includes(user.role)
        ? api.get('/finance/dashboard', { params: query }).then((r) => r.data)
        : Promise.resolve(null),
    ])
      .then(([ops, finance]) => {
        setOpsData(ops ?? null)
        setFinanceData(finance ?? null)
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load dashboard')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-atc-bg-alt border-2 border-atc-primary border-t-transparent animate-spin" />
          <p className="text-sm text-atc-text-muted">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-atc-border bg-white p-6">
        <p className="text-atc-danger font-medium">{error}</p>
        <p className="text-sm text-atc-text-muted mt-1">
          Check that the API is running and you are logged in.
        </p>
      </div>
    )
  }

  const showOps = opsData && OPS_ROLES.includes(userRole || '')
  const showFinance = financeData && FINANCE_ROLES.includes(userRole || '')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-atc-text">Dashboard</h1>
        <p className="text-atc-text-muted mt-1">
          Overview of operations and finance (last 30 days).
        </p>
      </div>

      {showOps && (
        <section>
          <h2 className="text-lg font-heading font-semibold text-atc-text mb-4">
            Operations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Pending acceptance"
              value={opsData.counts.pendingAcceptance}
              icon={Clock}
              href="/trips?assignmentStatus=ASSIGNED_PENDING_ACCEPTANCE"
              variant="warning"
            />
            <StatCard
              title="POD pending review"
              value={opsData.counts.podUploadedPendingReview}
              icon={FileCheck}
              href="/trips?podStatus=POD_UPLOADED_PENDING_REVIEW"
              variant="warning"
            />
            <StatCard
              title="No update (3h after call)"
              value={opsData.counts.noUpdateCallTime}
              icon={AlertTriangle}
              variant="warning"
            />
            <StatCard
              title="Open incidents"
              value={opsData.openIncidents.length}
              icon={AlertTriangle}
              href="/incidents"
              variant={opsData.openIncidents.length > 0 ? 'warning' : 'default'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-atc-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-atc-text">
                  Pending acceptance
                </h3>
                <Link
                  href="/trips?assignmentStatus=ASSIGNED_PENDING_ACCEPTANCE"
                  className="text-sm text-atc-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              {opsData.pendingAcceptanceTrips.length === 0 ? (
                <p className="text-sm text-atc-text-muted">None</p>
              ) : (
                <ul className="space-y-2">
                  {opsData.pendingAcceptanceTrips.slice(0, 5).map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/trips/${t.id}`}
                        className="text-sm text-atc-text hover:text-atc-primary flex justify-between"
                      >
                        <span>{t.internalRef}</span>
                        <span className="text-atc-text-muted">
                          {t.assignedDriver
                            ? `${t.assignedDriver.firstName} ${t.assignedDriver.lastName}`
                            : '—'} · {formatDate(t.runsheetDate)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-lg border border-atc-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-atc-text">
                  Open incidents
                </h3>
                <Link
                  href="/incidents"
                  className="text-sm text-atc-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              {opsData.openIncidents.length === 0 ? (
                <p className="text-sm text-atc-text-muted">None</p>
              ) : (
                <ul className="space-y-2">
                  {opsData.openIncidents.slice(0, 5).map((i) => (
                    <li key={i.id}>
                      <Link
                        href={`/trips/${i.tripId}`}
                        className="text-sm text-atc-text hover:text-atc-primary flex justify-between gap-2"
                      >
                        <span>
                          {i.trip?.internalRef ?? i.tripId} — {i.incidentType}
                        </span>
                        <span className="text-atc-text-muted shrink-0">
                          {i.severity} · {formatDate(i.reportedAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {showFinance && (
        <section>
          <h2 className="text-lg font-heading font-semibold text-atc-text mb-4">
            Finance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="POD verified, doc not received"
              value={financeData.counts.podVerifiedNotReceived}
              icon={Receipt}
              href="/finance"
              variant="warning"
            />
            <StatCard
              title="Doc received, not computed"
              value={financeData.counts.docReceivedNotComputed}
              icon={FileCheck}
              href="/finance"
              variant="warning"
            />
            <StatCard
              title="Ready to bill"
              value={financeData.counts.billingReadyToBill}
              icon={DollarSign}
              href="/finance"
            />
            <StatCard
              title="Payout ready"
              value={financeData.counts.payoutReadyForPayout}
              icon={TrendingUp}
              href="/finance"
              variant="success"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-atc-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-atc-text">
                  POD verified, doc not received
                </h3>
                <Link href="/finance" className="text-sm text-atc-primary hover:underline">
                  View all
                </Link>
              </div>
              {financeData.podVerifiedNotReceivedList.length === 0 ? (
                <p className="text-sm text-atc-text-muted">None</p>
              ) : (
                <ul className="space-y-2">
                  {financeData.podVerifiedNotReceivedList.slice(0, 5).map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/trips/${t.id}`}
                        className="text-sm text-atc-text hover:text-atc-primary flex justify-between"
                      >
                        <span>{t.internalRef}</span>
                        <span className="text-atc-text-muted">
                          {formatDate(t.runsheetDate)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-lg border border-atc-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-atc-text">
                  Override requests (pending CFO)
                </h3>
                <Link href="/finance" className="text-sm text-atc-primary hover:underline">
                  View all
                </Link>
              </div>
              {financeData.overridesPendingList.length === 0 ? (
                <p className="text-sm text-atc-text-muted">None</p>
              ) : (
                <ul className="space-y-2">
                  {financeData.overridesPendingList.slice(0, 5).map((o) => (
                    <li key={o.id}>
                      <Link
                        href={o.trip ? `/trips/${o.trip.id}` : '#'}
                        className="text-sm text-atc-text hover:text-atc-primary flex justify-between"
                      >
                        <span>{o.trip?.internalRef ?? '—'}</span>
                        <span className="text-atc-text-muted">
                          {o.trip?.runsheetDate
                            ? formatDate(o.trip.runsheetDate)
                            : '—'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {!showOps && !showFinance && (
        <div className="bg-white rounded-lg border border-atc-border p-6">
          <p className="text-atc-text-muted">
            Your role does not have access to operations or finance dashboards.
          </p>
        </div>
      )}
    </div>
  )
}
