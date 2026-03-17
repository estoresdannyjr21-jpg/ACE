'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS'

interface Incident {
  id: string
  tripId: string
  incidentType: string
  severity: string
  status: string
  description: string | null
  reportedAt: string
  trip?: { id: string; internalRef: string } | null
}

interface OpsIncidentsResponse {
  openIncidents: Incident[]
}

function formatDateTime(s: string) {
  const d = new Date(s)
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function IncidentsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [data, setData] = useState<OpsIncidentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const q = searchParams.get('q') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''
  const status = (searchParams.get('status') as IncidentStatus | '') ?? ''

  const [searchInput, setSearchInput] = useState(q)

  useEffect(() => {
    setSearchInput(q)
  }, [q])

  useEffect(() => {
    // Default date range: last 30 days
    let from = dateFrom
    let to = dateTo
    if (!from || !to) {
      const now = new Date()
      const fromDate = new Date(now)
      fromDate.setDate(fromDate.getDate() - 30)
      from = from || fromDate.toISOString().split('T')[0]
      to = to || now.toISOString().split('T')[0]
    }

    const params: Record<string, string> = { dateFrom: from, dateTo: to }
    if (status) params.incidentStatus = status

    setLoading(true)
    setError(null)

    api
      .get('/dispatch/dashboard/operations', { params })
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || 'Failed to load incidents'),
      )
      .finally(() => setLoading(false))
  }, [dateFrom, dateTo, status])

  const filteredIncidents = useMemo(() => {
    const incidents = data?.openIncidents ?? []
    if (!q.trim()) return incidents
    const term = q.trim().toLowerCase()
    return incidents.filter((i) => {
      const ref = i.trip?.internalRef?.toLowerCase() ?? ''
      const desc = i.description?.toLowerCase() ?? ''
      return ref.includes(term) || desc.includes(term)
    })
  }, [data, q])

  const updateSearch = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    return `?${next.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-atc-text">
            Incidents
          </h1>
          <p className="text-sm text-atc-text-muted mt-1">
            Monitor and follow up on open trip incidents.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-atc-border p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <Label htmlFor="search" className="sr-only">
              Search
            </Label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-atc-text-muted" />
                <Input
                  id="search"
                  type="search"
                  placeholder="Search by trip ref or description"
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
              <Button
                type="button"
                onClick={() => router.push(updateSearch('q', searchInput))}
              >
                Search
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dateFrom">From date</Label>
            <Input
              id="dateFrom"
              type="date"
              defaultValue={dateFrom}
              onChange={(e) =>
                router.push(updateSearch('dateFrom', e.target.value))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dateTo">To date</Label>
            <Input
              id="dateTo"
              type="date"
              defaultValue={dateTo}
              onChange={(e) =>
                router.push(updateSearch('dateTo', e.target.value))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
              value={status}
              onChange={(e) => router.push(updateSearch('status', e.target.value))}
            >
              <option value="">Any</option>
              <option value="OPEN">OPEN</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
            </select>
          </div>
        </div>

        {(dateFrom || dateTo || status || q) && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => router.push('/incidents')}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-lg border border-atc-border overflow-hidden">
        {error && (
          <div className="p-4 flex items-center gap-2 text-sm text-atc-danger bg-red-50 border-b border-red-100">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 rounded-full border-2 border-atc-primary border-t-transparent animate-spin" />
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="p-8 text-center text-atc-text-muted text-sm">
            No incidents found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-atc-border bg-atc-bg-subtle">
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">
                    Trip
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">
                    Severity
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">
                    Reported
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">
                    Description
                  </th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-atc-border hover:bg-atc-bg-subtle/60"
                  >
                    <td className="py-3 px-4">
                      {i.trip ? (
                        <Link
                          href={`/trips/${i.trip.id}`}
                          className="text-atc-primary font-medium hover:underline"
                        >
                          {i.trip.internalRef}
                        </Link>
                      ) : (
                        <span className="text-atc-text-muted text-xs">
                          {i.tripId}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">{i.incidentType}</td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded text-xs font-medium',
                          i.severity === 'CRITICAL' &&
                            'bg-red-50 text-red-800 border border-red-200',
                          i.severity === 'MAJOR' &&
                            'bg-amber-50 text-amber-800 border border-amber-200',
                          i.severity === 'MINOR' &&
                            'bg-atc-bg-alt text-atc-text border border-atc-border',
                          !['CRITICAL', 'MAJOR', 'MINOR'].includes(i.severity) &&
                            'bg-atc-bg-alt text-atc-text-muted border border-atc-border',
                        )}
                      >
                        {i.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded text-xs font-medium',
                          i.status === 'OPEN' &&
                            'bg-red-50 text-red-800 border border-red-200',
                          i.status === 'ACKNOWLEDGED' &&
                            'bg-amber-50 text-amber-800 border border-amber-200',
                          i.status === 'IN_PROGRESS' &&
                            'bg-atc-bg-alt text-atc-text border border-atc-border',
                          !['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes(
                            i.status,
                          ) &&
                            'bg-atc-bg-alt text-atc-text-muted border border-atc-border',
                        )}
                      >
                        {i.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-atc-text-muted">
                      {formatDateTime(i.reportedAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="block max-w-xs truncate">
                        {i.description ?? '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/trips/${i.tripId}`}
                        className="text-atc-primary hover:underline text-xs"
                      >
                        View trip
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
