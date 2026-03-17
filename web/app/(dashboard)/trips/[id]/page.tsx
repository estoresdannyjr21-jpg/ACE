'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Truck, User, MapPin, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  routeCode: string | null
  vehicleType: string
  assignedDriver?: { id: string; firstName: string; lastName: string; phone: string | null } | null
  assignedVehicle?: { id: string; plateNumber: string } | null
  serviceCategory?: { id: string; name: string; code: string } | null
  clientAccount?: { id: string; name: string; code: string } | null
  stops?: Array<{
    id: string
    stopSequence: number
    stopType: string
    address: string | null
    events?: Array<{
      id: string
      eventType: string
      eventTime: string
    }>
  }>
  incidents?: Array<{
    id: string
    incidentType: string
    severity: string
    status: string
    description: string | null
    reportedAt: string
  }>
  finance?: {
    id: string
    billingStatus: string | null
    payoutStatus: string | null
  } | null
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-PH', {
    weekday: 'short',
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

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api
      .get(`/dispatch/trips/${id}`)
      .then((res) => setTrip(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Trip not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="w-10 h-10 rounded-full border-2 border-atc-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="space-y-4">
        <Link href="/trips" className="inline-flex items-center text-sm text-atc-primary hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Trips
        </Link>
        <div className="bg-white rounded-lg border border-atc-border p-6">
          <p className="text-atc-danger font-medium">{error || 'Trip not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/trips"
            className="p-2 rounded-md hover:bg-atc-bg-subtle text-atc-text-muted hover:text-atc-text"
            aria-label="Back to trips"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold text-atc-text">
              {trip.internalRef}
            </h1>
            <p className="text-sm text-atc-text-muted mt-0.5">
              {trip.clientAccount?.name ?? '—'} · {trip.serviceCategory?.name ?? '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-atc-border p-6 space-y-4">
          <h2 className="font-heading font-semibold text-atc-text flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule &amp; route
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-atc-text-muted">Runsheet date</dt>
              <dd className="font-medium text-atc-text">{formatDate(trip.runsheetDate)}</dd>
            </div>
            <div>
              <dt className="text-atc-text-muted">Call time</dt>
              <dd className="font-medium text-atc-text">{formatTime(trip.callTime)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-atc-text-muted">Route</dt>
              <dd className="font-medium text-atc-text flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 text-atc-text-muted" />
                {trip.originArea} → {trip.destinationArea}
              </dd>
            </div>
            <div>
              <dt className="text-atc-text-muted">Assignment</dt>
              <dd>
                <span
                  className={cn(
                    'inline-block px-2 py-0.5 rounded text-xs font-medium',
                    trip.assignmentStatus === 'ACCEPTED' && 'bg-emerald-50 text-emerald-800',
                    trip.assignmentStatus === 'ASSIGNED_PENDING_ACCEPTANCE' && 'bg-amber-50 text-amber-800',
                    trip.assignmentStatus === 'DECLINED' && 'bg-red-50 text-red-800',
                    !['ACCEPTED', 'ASSIGNED_PENDING_ACCEPTANCE', 'DECLINED'].includes(trip.assignmentStatus) && 'bg-atc-bg-alt text-atc-text-muted'
                  )}
                >
                  {trip.assignmentStatus.replace(/_/g, ' ')}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-atc-text-muted">POD status</dt>
              <dd>
                <span
                  className={cn(
                    'inline-block px-2 py-0.5 rounded text-xs font-medium',
                    trip.podStatus === 'POD_VERIFIED' && 'bg-emerald-50 text-emerald-800',
                    trip.podStatus === 'POD_UPLOADED_PENDING_REVIEW' && 'bg-amber-50 text-amber-800',
                    trip.podStatus === 'POD_REJECTED_NEEDS_REUPLOAD' && 'bg-red-50 text-red-800',
                    !['POD_VERIFIED', 'POD_UPLOADED_PENDING_REVIEW', 'POD_REJECTED_NEEDS_REUPLOAD'].includes(trip.podStatus) && 'bg-atc-bg-alt text-atc-text-muted'
                  )}
                >
                  {trip.podStatus.replace(/_/g, ' ')}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-atc-border p-6 space-y-4">
          <h2 className="font-heading font-semibold text-atc-text flex items-center gap-2">
            <User className="w-5 h-5" />
            Driver &amp; vehicle
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-atc-text-muted">Driver</dt>
              <dd className="font-medium text-atc-text">
                {trip.assignedDriver
                  ? `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}`
                  : '—'}
              </dd>
              {trip.assignedDriver?.phone && (
                <dd className="text-atc-text-muted text-xs mt-0.5">{trip.assignedDriver.phone}</dd>
              )}
            </div>
            <div>
              <dt className="text-atc-text-muted">Vehicle</dt>
              <dd className="font-medium text-atc-text flex items-center gap-2">
                <Truck className="w-4 h-4 text-atc-text-muted" />
                {trip.assignedVehicle?.plateNumber ?? '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {trip.finance && (
        <div className="bg-white rounded-lg border border-atc-border p-6">
          <h2 className="font-heading font-semibold text-atc-text flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5" />
            Finance
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-atc-text-muted">Billing status</dt>
              <dd className="font-medium text-atc-text">
                {trip.finance.billingStatus?.replace(/_/g, ' ') ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-atc-text-muted">Payout status</dt>
              <dd className="font-medium text-atc-text">
                {trip.finance.payoutStatus?.replace(/_/g, ' ') ?? '—'}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {trip.incidents && trip.incidents.length > 0 && (
        <div className="bg-white rounded-lg border border-atc-border p-6">
          <h2 className="font-heading font-semibold text-atc-text mb-4">Incidents</h2>
          <ul className="space-y-3">
            {trip.incidents.map((inc) => (
              <li
                key={inc.id}
                className="flex flex-wrap items-start justify-between gap-2 p-3 rounded-lg bg-atc-bg-subtle border border-atc-border"
              >
                <div>
                  <p className="font-medium text-atc-text">
                    {inc.incidentType} · {inc.severity}
                  </p>
                  {inc.description && (
                    <p className="text-sm text-atc-text-muted mt-1">{inc.description}</p>
                  )}
                  <p className="text-xs text-atc-text-muted mt-1">
                    {formatDate(inc.reportedAt)} — {inc.status}
                  </p>
                </div>
                <Link href={`/incidents?tripId=${trip.id}`}>
                  <Button variant="ghost" size="sm">View</Button>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {trip.stops && trip.stops.length > 0 && (
        <div className="bg-white rounded-lg border border-atc-border p-6">
          <h2 className="font-heading font-semibold text-atc-text mb-4">Stops &amp; events</h2>
          <ol className="space-y-4">
            {trip.stops
              .sort((a, b) => a.stopSequence - b.stopSequence)
              .map((stop) => (
                <li key={stop.id} className="border-l-2 border-atc-border pl-4">
                  <p className="font-medium text-atc-text">
                    Stop {stop.stopSequence} — {stop.stopType}
                  </p>
                  {stop.address && (
                    <p className="text-sm text-atc-text-muted">{stop.address}</p>
                  )}
                  {stop.events && stop.events.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-atc-text-muted">
                      {stop.events
                        .sort(
                          (a, b) =>
                            new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime()
                        )
                        .map((ev) => (
                          <li key={ev.id}>
                            {ev.eventType} at {formatTime(ev.eventTime)}
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              ))}
          </ol>
        </div>
      )}
    </div>
  )
}
