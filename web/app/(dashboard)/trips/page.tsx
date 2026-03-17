'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

const ASSIGNMENT_STATUSES = [
  { value: '', label: 'Any' },
  { value: 'ASSIGNED_PENDING_ACCEPTANCE', label: 'Pending acceptance' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'UNASSIGNED', label: 'Unassigned' },
]

const POD_STATUSES = [
  { value: '', label: 'Any' },
  { value: 'NOT_UPLOADED', label: 'Not uploaded' },
  { value: 'POD_UPLOADED_PENDING_REVIEW', label: 'Pending review' },
  { value: 'POD_REJECTED_NEEDS_REUPLOAD', label: 'Rejected' },
  { value: 'POD_VERIFIED', label: 'Verified' },
]

interface Trip {
  id: string
  internalRef: string
  externalRef: string | null
  runsheetDate: string
  callTime: string
  assignmentStatus: string
  highLevelTripStatus: string
  podStatus: string
  originArea: string
  destinationArea: string
  assignedDriver?: { id: string; firstName: string; lastName: string } | null
  assignedVehicle?: { id: string; plateNumber: string } | null
  serviceCategory?: { id: string; name: string; code: string } | null
  clientAccount?: { id: string; name: string; code: string } | null
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(s: string) {
  return new Date(s).toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TripsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  const q = searchParams.get('q') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''
  const assignmentStatus = searchParams.get('assignmentStatus') ?? ''
  const podStatus = searchParams.get('podStatus') ?? ''

  useEffect(() => {
    setSearchInput(q)
  }, [q])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    if (assignmentStatus) params.assignmentStatus = assignmentStatus
    if (podStatus) params.podStatus = podStatus
    if (q.trim()) params.internalRef = q.trim()

    setLoading(true)
    api
      .get('/dispatch/trips', { params })
      .then((res) => setTrips(res.data ?? []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load trips'))
      .finally(() => setLoading(false))
  }, [dateFrom, dateTo, assignmentStatus, podStatus, q])

  const updateSearch = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    return `?${next.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-heading font-bold text-atc-text">Trips</h1>
      </div>

      <div className="bg-white rounded-lg border border-atc-border p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="search" className="sr-only">Search by trip ref</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-atc-text-muted" />
              <Input
                id="search"
                type="search"
                placeholder="Trip ref (e.g. TR-...)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    router.push(updateSearch('q', searchInput))
                  }
                }}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          {(dateFrom || dateTo || assignmentStatus || podStatus) && (
            <Link href="/trips">
              <Button variant="ghost" size="sm">Clear</Button>
            </Link>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-atc-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom">From date</Label>
              <Input
                id="dateFrom"
                type="date"
                defaultValue={dateFrom}
                onChange={(e) => router.push(updateSearch('dateFrom', e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To date</Label>
              <Input
                id="dateTo"
                type="date"
                defaultValue={dateTo}
                onChange={(e) => router.push(updateSearch('dateTo', e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="assignmentStatus">Assignment</Label>
              <select
                id="assignmentStatus"
                className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
                value={assignmentStatus}
                onChange={(e) => router.push(updateSearch('assignmentStatus', e.target.value))}
              >
                {ASSIGNMENT_STATUSES.map((o) => (
                  <option key={o.value || 'any'} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="podStatus">POD status</Label>
              <select
                id="podStatus"
                className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
                value={podStatus}
                onChange={(e) => router.push(updateSearch('podStatus', e.target.value))}
              >
                {POD_STATUSES.map((o) => (
                  <option key={o.value || 'any'} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-atc-border overflow-hidden">
        {error && (
          <div className="p-4 text-atc-danger font-medium">{error}</div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 rounded-full border-2 border-atc-primary border-t-transparent animate-spin" />
          </div>
        ) : trips.length === 0 ? (
          <div className="p-8 text-center text-atc-text-muted">
            No trips found. Adjust filters or create a trip from Dispatch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-atc-border bg-atc-bg-subtle">
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">Ref</th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">Runsheet date</th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">Route</th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">Driver</th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">Plate</th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">Assignment</th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">POD</th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text"></th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-atc-border hover:bg-atc-bg-subtle/50"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/trips/${t.id}`}
                        className="font-medium text-atc-primary hover:underline"
                      >
                        {t.internalRef}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-atc-text-muted">
                      {formatDate(t.runsheetDate)} {formatTime(t.callTime)}
                    </td>
                    <td className="py-3 px-4">
                      {t.originArea} → {t.destinationArea}
                    </td>
                    <td className="py-3 px-4">
                      {t.assignedDriver
                        ? `${t.assignedDriver.firstName} ${t.assignedDriver.lastName}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {t.assignedVehicle?.plateNumber ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded text-xs font-medium',
                          t.assignmentStatus === 'ACCEPTED' && 'bg-emerald-50 text-emerald-800',
                          t.assignmentStatus === 'ASSIGNED_PENDING_ACCEPTANCE' && 'bg-amber-50 text-amber-800',
                          t.assignmentStatus === 'DECLINED' && 'bg-red-50 text-red-800',
                          !['ACCEPTED', 'ASSIGNED_PENDING_ACCEPTANCE', 'DECLINED'].includes(t.assignmentStatus) && 'bg-atc-bg-alt text-atc-text-muted'
                        )}
                      >
                        {t.assignmentStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded text-xs font-medium',
                          t.podStatus === 'POD_VERIFIED' && 'bg-emerald-50 text-emerald-800',
                          t.podStatus === 'POD_UPLOADED_PENDING_REVIEW' && 'bg-amber-50 text-amber-800',
                          t.podStatus === 'POD_REJECTED_NEEDS_REUPLOAD' && 'bg-red-50 text-red-800',
                          !['POD_VERIFIED', 'POD_UPLOADED_PENDING_REVIEW', 'POD_REJECTED_NEEDS_REUPLOAD'].includes(t.podStatus) && 'bg-atc-bg-alt text-atc-text-muted'
                        )}
                      >
                        {t.podStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/trips/${t.id}`}
                        className="text-atc-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
