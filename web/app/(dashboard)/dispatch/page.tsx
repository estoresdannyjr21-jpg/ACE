'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, FilePlus2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OpsCounts {
  pendingAcceptance: number
  acceptedOngoing: number
  completed: number
  podUploadedPendingReview: number
  podRejected: number
  podVerified: number
  financeDocReceived: number
  noUpdateCallTime: number
}

interface OpsSummary {
  counts: OpsCounts
}

interface LookupClient {
  id: string
  name: string
  code: string | null
  serviceCategories: Array<{ id: string; name: string; code: string | null }>
}

interface LookupDriver {
  id: string
  firstName: string
  lastName: string
  assignments: Array<{
    operatorId: string
    operator: { id: string; name: string }
  }>
}

interface LookupVehicle {
  id: string
  plateNumber: string
  vehicleType: string
  bodyType: string | null
  assignments: Array<{
    operatorId: string
    operator: { id: string; name: string }
  }>
}

interface TripFieldOptions {
  originAreas: string[]
  destinationAreas: string[]
  vehicleTypes: string[]
}

interface DispatchLookups {
  clients: LookupClient[]
  drivers: LookupDriver[]
  vehicles: LookupVehicle[]
  tripFieldOptions?: TripFieldOptions
}

function StatPill({
  label,
  value,
  variant = 'default',
}: {
  label: string
  value: number
  variant?: 'default' | 'warning'
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-full border px-4 py-2 text-xs font-medium',
        variant === 'warning'
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-atc-border bg-atc-bg-subtle text-atc-text',
      )}
    >
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

export default function DispatchPage() {
  const [ops, setOps] = useState<OpsSummary | null>(null)
  const [loadingOps, setLoadingOps] = useState(true)
  const [opsError, setOpsError] = useState<string | null>(null)

  const [lookups, setLookups] = useState<DispatchLookups | null>(null)
  const [loadingLookups, setLoadingLookups] = useState(true)
  const [lookupsError, setLookupsError] = useState<string | null>(null)

  const [clientAccountId, setClientAccountId] = useState('')
  const [serviceCategoryId, setServiceCategoryId] = useState('')
  const [originArea, setOriginArea] = useState('')
  const [destinationArea, setDestinationArea] = useState('')
  const [runsheetDate, setRunsheetDate] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [callTime, setCallTime] = useState('08:00')
  const [assignedDriverId, setAssignedDriverId] = useState('')
  const [assignedVehicleId, setAssignedVehicleId] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [externalRef, setExternalRef] = useState('')

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdTripRef, setCreatedTripRef] = useState<{
    id: string
    internalRef: string
    rateExpiryWarning?: boolean
  } | null>(null)

  useEffect(() => {
    const dateTo = new Date()
    const dateFrom = new Date(dateTo)
    dateFrom.setDate(dateFrom.getDate() - 7)

    const query = {
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
    }

    api
      .get('/dispatch/dashboard/operations', { params: query })
      .then((res) => setOps(res.data))
      .catch((err) =>
        setOpsError(
          err.response?.data?.message || 'Failed to load operations summary',
        ),
      )
      .finally(() => setLoadingOps(false))
  }, [])

  useEffect(() => {
    setLoadingLookups(true)
    setLookupsError(null)
    api
      .get('/dispatch/lookups')
      .then((res) => setLookups(res.data))
      .catch((err) =>
        setLookupsError(err.response?.data?.message || 'Failed to load lookups'),
      )
      .finally(() => setLoadingLookups(false))
  }, [])

  const clients = lookups?.clients ?? []
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientAccountId) ?? null,
    [clients, clientAccountId],
  )
  const serviceCategories = useMemo(() => {
    if (!lookups) return []
    if (selectedClient) return selectedClient.serviceCategories
    // fallback (if no client selected yet): show all categories
    const all = lookups.clients.flatMap((c) => c.serviceCategories)
    const uniq = new Map<string, { id: string; name: string; code: string | null }>()
    for (const cat of all) uniq.set(cat.id, cat)
    return Array.from(uniq.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [lookups, selectedClient])

  const drivers = lookups?.drivers ?? []
  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === assignedDriverId) ?? null,
    [drivers, assignedDriverId],
  )
  const selectedDriverOperatorId = selectedDriver?.assignments?.[0]?.operatorId ?? null

  const vehiclesAll = lookups?.vehicles ?? []
  const originChoices = lookups?.tripFieldOptions?.originAreas ?? []
  const destinationChoices = lookups?.tripFieldOptions?.destinationAreas ?? []
  const vehicleTypeChoicesBase = lookups?.tripFieldOptions?.vehicleTypes ?? []

  const vehicles = useMemo(() => {
    if (!selectedDriverOperatorId) return vehiclesAll
    return vehiclesAll.filter((v) => v.assignments?.[0]?.operatorId === selectedDriverOperatorId)
  }, [vehiclesAll, selectedDriverOperatorId])

  const selectedVehicle = useMemo(
    () => vehiclesAll.find((v) => v.id === assignedVehicleId) ?? null,
    [vehiclesAll, assignedVehicleId],
  )

  const vehicleTypeChoices = useMemo(() => {
    const set = new Set(vehicleTypeChoicesBase)
    const v = selectedVehicle?.vehicleType
    if (v) set.add(v)
    return [...set].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    )
  }, [vehicleTypeChoicesBase, selectedVehicle?.vehicleType])

  useEffect(() => {
    // keep service category valid for selected client
    if (!selectedClient) return
    const ok = selectedClient.serviceCategories.some((c) => c.id === serviceCategoryId)
    if (!ok) setServiceCategoryId('')
  }, [selectedClient, serviceCategoryId])

  useEffect(() => {
    // If driver changes and current vehicle doesn't match operator, clear it.
    if (!selectedDriverOperatorId) return
    if (!assignedVehicleId) return
    const v = vehiclesAll.find((x) => x.id === assignedVehicleId)
    const vOp = v?.assignments?.[0]?.operatorId ?? null
    if (vOp && vOp !== selectedDriverOperatorId) {
      setAssignedVehicleId('')
      setVehicleType('')
    }
  }, [selectedDriverOperatorId, assignedVehicleId, vehiclesAll])

  useEffect(() => {
    // Derive vehicleType from selected vehicle
    if (!selectedVehicle) {
      setVehicleType('')
      return
    }
    setVehicleType(selectedVehicle.vehicleType)
  }, [selectedVehicle])

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setCreatedTripRef(null)

    if (
      !clientAccountId ||
      !serviceCategoryId ||
      !originArea ||
      !destinationArea ||
      !runsheetDate ||
      !callTime ||
      !assignedDriverId ||
      !assignedVehicleId ||
      !vehicleType
    ) {
      setCreateError('Please fill in all required fields.')
      return
    }

    setCreating(true)
    try {
      const callDateTime = new Date(`${runsheetDate}T${callTime}:00`)

      const payload = {
        clientAccountId,
        serviceCategoryId,
        originArea,
        destinationArea,
        runsheetDate,
        callTime: callDateTime.toISOString(),
        vehicleType,
        assignedDriverId,
        assignedVehicleId,
        externalRef: externalRef || undefined,
      }

      const res = await api.post('/dispatch/trips', payload)
      const trip = res.data?.trip ?? res.data

      api.get('/dispatch/lookups').then((r) => setLookups(r.data)).catch(() => {})

      setCreatedTripRef({
        id: trip.id,
        internalRef: trip.internalRef,
        rateExpiryWarning: !!res.data?.rateExpiryWarning,
      })

      // Reset some fields for the next entry
      setExternalRef('')
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create trip')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-atc-text">
            Dispatch
          </h1>
          <p className="text-atc-text-muted mt-1 text-sm">
            Create trips and monitor today&apos;s dispatch health.
          </p>
        </div>
        <Link href="/trips">
          <Button variant="secondary" size="sm">
            View all trips
          </Button>
        </Link>
      </div>

      {/* Quick operations summary */}
      <div className="bg-white rounded-lg border border-atc-border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-atc-text">Today / recent</p>
          {loadingOps && (
            <span className="text-xs text-atc-text-muted">Loading…</span>
          )}
        </div>

        {opsError && (
          <div className="flex items-center gap-2 text-xs text-atc-danger bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-3">
            <AlertTriangle className="w-4 h-4" />
            <span>{opsError}</span>
          </div>
        )}

        {ops && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatPill
              label="Pending acceptance"
              value={ops.counts.pendingAcceptance}
              variant={ops.counts.pendingAcceptance > 0 ? 'warning' : 'default'}
            />
            <StatPill
              label="POD pending review"
              value={ops.counts.podUploadedPendingReview}
              variant={
                ops.counts.podUploadedPendingReview > 0 ? 'warning' : 'default'
              }
            />
            <StatPill
              label="No update (3h after call)"
              value={ops.counts.noUpdateCallTime}
              variant={ops.counts.noUpdateCallTime > 0 ? 'warning' : 'default'}
            />
            <StatPill
              label="Open incidents"
              value={ops.counts.pendingAcceptance /* placeholder */}
            />
          </div>
        )}
      </div>

      {/* Trip creation form */}
      <div className="bg-white rounded-lg border border-atc-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <FilePlus2 className="w-5 h-5 text-atc-primary" />
          <h2 className="text-lg font-heading font-semibold text-atc-text">
            Create trip
          </h2>
        </div>

        <p className="text-xs text-atc-text-muted mb-4">
          Select client/category and driver/vehicle from master data. Vehicle list auto-filters
          to the driver&apos;s operator to prevent mismatches.
        </p>

        {lookupsError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-atc-danger">
            {lookupsError}
          </div>
        )}

        {createdTripRef && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <p className="font-medium">
              Trip {createdTripRef.internalRef} created successfully.
            </p>
            <p className="mt-1">
              <Link
                href={`/trips/${createdTripRef.id}`}
                className="underline underline-offset-2"
              >
                View trip details
              </Link>
              {createdTripRef.rateExpiryWarning && (
                <span className="ml-1">
                  · Active rate is expiring soon for this route.
                </span>
              )}
            </p>
          </div>
        )}

        {createError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-atc-danger">
            {createError}
          </div>
        )}

        <form onSubmit={handleCreateTrip} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="clientAccountId">Client</Label>
              <select
                id="clientAccountId"
                className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
                value={clientAccountId}
                onChange={(e) => {
                  setClientAccountId(e.target.value)
                  setServiceCategoryId('')
                }}
                disabled={loadingLookups}
                required
              >
                <option value="">— Select client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {(c.code ? `${c.code} · ` : '') + c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="serviceCategoryId">Service category</Label>
              <select
                id="serviceCategoryId"
                className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
                value={serviceCategoryId}
                onChange={(e) => setServiceCategoryId(e.target.value)}
                disabled={loadingLookups}
                required
              >
                <option value="">— Select category —</option>
                {serviceCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {(cat.code ? `${cat.code} · ` : '') + cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="originArea">Origin area</Label>
              {originChoices.length > 0 ? (
                <select
                  id="originArea"
                  className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
                  value={originArea}
                  onChange={(e) => setOriginArea(e.target.value)}
                  disabled={loadingLookups}
                  required
                >
                  <option value="">— Select origin area —</option>
                  {originChoices.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="originArea"
                  value={originArea}
                  onChange={(e) => setOriginArea(e.target.value)}
                  placeholder="No prior trips — type origin area"
                  required
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destinationArea">Destination area</Label>
              {destinationChoices.length > 0 ? (
                <select
                  id="destinationArea"
                  className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
                  value={destinationArea}
                  onChange={(e) => setDestinationArea(e.target.value)}
                  disabled={loadingLookups}
                  required
                >
                  <option value="">— Select destination area —</option>
                  {destinationChoices.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="destinationArea"
                  value={destinationArea}
                  onChange={(e) => setDestinationArea(e.target.value)}
                  placeholder="No prior trips — type destination area"
                  required
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="runsheetDate">Runsheet date</Label>
              <Input
                id="runsheetDate"
                type="date"
                value={runsheetDate}
                onChange={(e) => setRunsheetDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="callTime">Call time</Label>
              <Input
                id="callTime"
                type="time"
                value={callTime}
                onChange={(e) => setCallTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="assignedDriverId">Driver</Label>
              <select
                id="assignedDriverId"
                className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
                value={assignedDriverId}
                onChange={(e) => setAssignedDriverId(e.target.value)}
                disabled={loadingLookups}
                required
              >
                <option value="">— Select driver —</option>
                {drivers.map((d) => {
                  const op = d.assignments?.[0]?.operator?.name
                  return (
                    <option key={d.id} value={d.id}>
                      {d.lastName}, {d.firstName}
                      {op ? ` · ${op}` : ''}
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assignedVehicleId">Vehicle</Label>
              <select
                id="assignedVehicleId"
                className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
                value={assignedVehicleId}
                onChange={(e) => setAssignedVehicleId(e.target.value)}
                disabled={loadingLookups || vehicles.length === 0}
                required
              >
                <option value="">
                  {vehicles.length === 0
                    ? '— No vehicles available for selected driver —'
                    : '— Select vehicle —'}
                </option>
                {vehicles.map((v) => {
                  const op = v.assignments?.[0]?.operator?.name
                  const label = `${v.plateNumber} · ${v.vehicleType}${op ? ` · ${op}` : ''}`
                  return (
                    <option key={v.id} value={v.id}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vehicleType">Vehicle type</Label>
              {vehicleTypeChoices.length > 0 ? (
                <select
                  id="vehicleType"
                  className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  disabled={loadingLookups}
                  required
                >
                  <option value="">— Select vehicle type —</option>
                  {vehicleTypeChoices.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="vehicleType"
                  value={vehicleType}
                  readOnly
                  placeholder="Auto-set from selected vehicle"
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="externalRef">
              Client runsheet / reference (optional)
            </Label>
            <Input
              id="externalRef"
              value={externalRef}
              onChange={(e) => setExternalRef(e.target.value)}
              placeholder="Client runsheet / waybill reference"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating trip…' : 'Create trip'}
            </Button>
            <p className="text-xs text-atc-text-muted">
              System will enforce operator/vehicle mapping and active route rate
              before saving.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
