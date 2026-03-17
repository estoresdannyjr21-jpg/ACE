'use client'

import { useEffect, useMemo, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign, Plus } from 'lucide-react'

interface LookupClient {
  id: string
  name: string
  code: string | null
  serviceCategories: Array<{ id: string; name: string; code: string | null }>
}

interface LookupsResponse {
  clients: LookupClient[]
}

interface RateRow {
  id: string
  originArea: string
  destinationArea: string
  effectiveStart: string
  effectiveEnd: string | null
  billRateAmount: number | string
  tripPayoutRateVatable: number | string
  clientAccount?: { id: string; name: string; code: string | null }
  serviceCategory?: { id: string; name: string; code: string | null }
}

function toNumber(n: number | string) {
  if (typeof n === 'number') return n
  const parsed = Number(n)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatMoney(n: number | string) {
  const v = toNumber(n)
  return v.toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function RatesPage() {
  const [lookups, setLookups] = useState<LookupsResponse | null>(null)
  const [rates, setRates] = useState<RateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterClientAccountId, setFilterClientAccountId] = useState('')
  const [filterServiceCategoryId, setFilterServiceCategoryId] = useState('')
  const [filterOriginArea, setFilterOriginArea] = useState('')
  const [filterDestinationArea, setFilterDestinationArea] = useState('')
  const [filterEffectiveOn, setFilterEffectiveOn] = useState('')

  // Create form
  const [clientAccountId, setClientAccountId] = useState('')
  const [serviceCategoryId, setServiceCategoryId] = useState('')
  const [originArea, setOriginArea] = useState('')
  const [destinationArea, setDestinationArea] = useState('')
  const [effectiveStart, setEffectiveStart] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [effectiveEnd, setEffectiveEnd] = useState('')
  const [billRateAmount, setBillRateAmount] = useState('')
  const [tripPayoutRateVatable, setTripPayoutRateVatable] = useState('')

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

  const selectedClientForCreate = useMemo(() => {
    return lookups?.clients.find((c) => c.id === clientAccountId) ?? null
  }, [lookups, clientAccountId])

  const categoriesForCreate = useMemo(() => {
    if (!lookups) return []
    if (selectedClientForCreate) return selectedClientForCreate.serviceCategories
    // fallback (if no client selected yet): show all categories
    const all = lookups.clients.flatMap((c) => c.serviceCategories)
    const uniq = new Map<string, { id: string; name: string; code: string | null }>()
    for (const cat of all) uniq.set(cat.id, cat)
    return Array.from(uniq.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [lookups, selectedClientForCreate])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [lookupsRes, ratesRes] = await Promise.all([
        api.get('/rates/lookups'),
        api.get('/rates', {
          params: {
            clientAccountId: filterClientAccountId || undefined,
            serviceCategoryId: filterServiceCategoryId || undefined,
            originArea: filterOriginArea.trim() || undefined,
            destinationArea: filterDestinationArea.trim() || undefined,
            effectiveOn: filterEffectiveOn || undefined,
          },
        }),
      ])

      setLookups(lookupsRes.data)
      setRates(ratesRes.data ?? [])
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message || 'Failed to load rates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // If client changes, ensure category still valid for that client.
    if (!lookups) return
    if (!clientAccountId) return
    const client = lookups.clients.find((c) => c.id === clientAccountId)
    const ok = !!client?.serviceCategories.some((c) => c.id === serviceCategoryId)
    if (!ok) setServiceCategoryId('')
  }, [lookups, clientAccountId, serviceCategoryId])

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    load()
  }

  const handleResetFilters = () => {
    setFilterClientAccountId('')
    setFilterServiceCategoryId('')
    setFilterOriginArea('')
    setFilterDestinationArea('')
    setFilterEffectiveOn('')
    // reload unfiltered
    setTimeout(load, 0)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setCreateSuccess(null)

    if (
      !clientAccountId ||
      !serviceCategoryId ||
      !originArea.trim() ||
      !destinationArea.trim() ||
      !effectiveStart ||
      !billRateAmount ||
      !tripPayoutRateVatable
    ) {
      setCreateError('Please fill in all required fields.')
      return
    }

    const bill = Number(billRateAmount)
    const payout = Number(tripPayoutRateVatable)
    if (!Number.isFinite(bill) || bill < 0 || !Number.isFinite(payout) || payout < 0) {
      setCreateError('Amounts must be valid non-negative numbers.')
      return
    }

    setCreating(true)
    try {
      const payload = {
        clientAccountId,
        serviceCategoryId,
        originArea: originArea.trim(),
        destinationArea: destinationArea.trim(),
        effectiveStart,
        effectiveEnd: effectiveEnd || undefined,
        billRateAmount: bill,
        tripPayoutRateVatable: payout,
      }

      const res = await api.post('/rates', payload)
      const created = res.data as { id?: string }
      setCreateSuccess(created?.id ? `Rate created (${created.id}).` : 'Rate created.')

      // reset just the route + amounts; keep client/category for faster entry
      setOriginArea('')
      setDestinationArea('')
      setBillRateAmount('')
      setTripPayoutRateVatable('')
      setEffectiveEnd('')
      setEffectiveStart(new Date().toISOString().split('T')[0])

      await load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setCreateError(ax.response?.data?.message || 'Failed to create rate')
    } finally {
      setCreating(false)
    }
  }

  const allClients = lookups?.clients ?? []
  const filterClient = useMemo(
    () => allClients.find((c) => c.id === filterClientAccountId) ?? null,
    [allClients, filterClientAccountId],
  )
  const filterCategories = useMemo(() => {
    if (!lookups) return []
    if (filterClient) return filterClient.serviceCategories
    const all = lookups.clients.flatMap((c) => c.serviceCategories)
    const uniq = new Map<string, { id: string; name: string; code: string | null }>()
    for (const cat of all) uniq.set(cat.id, cat)
    return Array.from(uniq.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [lookups, filterClient])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-atc-text">Rates</h1>
          <p className="text-sm text-atc-text-muted mt-1">
            Define route rates (client + category + origin/destination + effective period).
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-atc-danger">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-atc-border p-4">
        <p className="text-sm font-medium text-atc-text mb-3">Filters</p>
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="filter-client">Client</Label>
            <select
              id="filter-client"
              className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
              value={filterClientAccountId}
              onChange={(e) => {
                setFilterClientAccountId(e.target.value)
                setFilterServiceCategoryId('')
              }}
            >
              <option value="">— All —</option>
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c.code ? `${c.code} · ` : '') + c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="filter-category">Service category</Label>
            <select
              id="filter-category"
              className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
              value={filterServiceCategoryId}
              onChange={(e) => setFilterServiceCategoryId(e.target.value)}
            >
              <option value="">— All —</option>
              {filterCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {(cat.code ? `${cat.code} · ` : '') + cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-origin">Origin area</Label>
            <Input
              id="filter-origin"
              value={filterOriginArea}
              onChange={(e) => setFilterOriginArea(e.target.value)}
              placeholder="e.g. MNL"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-destination">Destination area</Label>
            <Input
              id="filter-destination"
              value={filterDestinationArea}
              onChange={(e) => setFilterDestinationArea(e.target.value)}
              placeholder="e.g. CAV"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-effective-on">Effective on</Label>
            <Input
              id="filter-effective-on"
              type="date"
              value={filterEffectiveOn}
              onChange={(e) => setFilterEffectiveOn(e.target.value)}
            />
          </div>

          <div className="flex items-end gap-2 lg:col-span-6">
            <Button type="submit" variant="secondary" size="sm" disabled={loading}>
              Apply
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters} disabled={loading}>
              Reset
            </Button>
            {loading && <span className="text-xs text-atc-text-muted">Loading…</span>}
          </div>
        </form>
      </div>

      {/* Create */}
      <div className="bg-white rounded-lg border border-atc-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-atc-primary" />
          <p className="text-sm font-medium text-atc-text">Create rate</p>
        </div>

        <p className="text-xs text-atc-text-muted mb-4">
          Note: the API prevents overlapping effective periods for the same client/category/route.
        </p>

        {createSuccess && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {createSuccess}
          </div>
        )}
        {createError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-atc-danger">
            {createError}
          </div>
        )}

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="create-client">Client *</Label>
            <select
              id="create-client"
              className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
              value={clientAccountId}
              onChange={(e) => {
                setClientAccountId(e.target.value)
                setServiceCategoryId('')
              }}
              required
            >
              <option value="">— Select —</option>
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c.code ? `${c.code} · ` : '') + c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="create-category">Service category *</Label>
            <select
              id="create-category"
              className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
              value={serviceCategoryId}
              onChange={(e) => setServiceCategoryId(e.target.value)}
              required
            >
              <option value="">— Select —</option>
              {categoriesForCreate.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {(cat.code ? `${cat.code} · ` : '') + cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-origin">Origin area *</Label>
            <Input
              id="create-origin"
              value={originArea}
              onChange={(e) => setOriginArea(e.target.value)}
              placeholder="e.g. MNL"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-destination">Destination area *</Label>
            <Input
              id="create-destination"
              value={destinationArea}
              onChange={(e) => setDestinationArea(e.target.value)}
              placeholder="e.g. CAV"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-start">Effective start *</Label>
            <Input
              id="create-start"
              type="date"
              value={effectiveStart}
              onChange={(e) => setEffectiveStart(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-end">Effective end</Label>
            <Input
              id="create-end"
              type="date"
              value={effectiveEnd}
              onChange={(e) => setEffectiveEnd(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-bill">Bill rate amount (PHP) *</Label>
            <Input
              id="create-bill"
              inputMode="decimal"
              value={billRateAmount}
              onChange={(e) => setBillRateAmount(e.target.value)}
              placeholder="e.g. 1500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-payout">Trip payout rate (VATable) *</Label>
            <Input
              id="create-payout"
              inputMode="decimal"
              value={tripPayoutRateVatable}
              onChange={(e) => setTripPayoutRateVatable(e.target.value)}
              placeholder="e.g. 1200"
              required
            />
          </div>

          <div className="flex items-end gap-2 lg:col-span-6">
            <Button type="submit" disabled={creating}>
              <Plus className="w-4 h-4 mr-2" />
              {creating ? 'Creating…' : 'Create rate'}
            </Button>
            {selectedClientForCreate && (
              <span className="text-xs text-atc-text-muted">
                Creating for {selectedClientForCreate.name}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 rounded-full border-2 border-atc-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-atc-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-atc-border bg-atc-bg-subtle">
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">Origin</th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">Destination</th>
                  <th className="text-left py-3 px-4 font-semibold text-atc-text">Effective</th>
                  <th className="text-right py-3 px-4 font-semibold text-atc-text">Bill (PHP)</th>
                  <th className="text-right py-3 px-4 font-semibold text-atc-text">Payout (PHP)</th>
                </tr>
              </thead>
              <tbody>
                {rates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-atc-text-muted">
                      No rates found. Create one above.
                    </td>
                  </tr>
                ) : (
                  rates.map((r) => (
                    <tr key={r.id} className="border-b border-atc-border hover:bg-atc-bg-subtle/50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-atc-text">
                          {r.clientAccount?.name ?? '—'}
                        </div>
                        <div className="text-xs text-atc-text-muted">
                          {r.clientAccount?.code ?? r.clientAccount?.id ?? '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-atc-text">
                          {r.serviceCategory?.name ?? '—'}
                        </div>
                        <div className="text-xs text-atc-text-muted">
                          {r.serviceCategory?.code ?? r.serviceCategory?.id ?? '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{r.originArea}</td>
                      <td className="py-3 px-4 font-medium">{r.destinationArea}</td>
                      <td className="py-3 px-4">
                        <div>{formatDate(r.effectiveStart)}</div>
                        <div className="text-xs text-atc-text-muted">
                          to {formatDate(r.effectiveEnd)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatMoney(r.billRateAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatMoney(r.tripPayoutRateVatable)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
