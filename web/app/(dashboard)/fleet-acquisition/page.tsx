'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Truck, User, Building2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'operators' | 'drivers' | 'vehicles'

interface Operator {
  id: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  status: string
}

interface Driver {
  id: string
  firstName: string
  lastName: string
  spxDriverId: string | null
  phone: string | null
  email: string | null
  status: string
  assignments: Array<{
    operator: { id: string; name: string }
  }>
}

interface Vehicle {
  id: string
  plateNumber: string
  vehicleType: string
  bodyType: string | null
  status: string
  assignments: Array<{
    operator: { id: string; name: string }
  }>
}

export default function FleetAcquisitionPage() {
  const [tab, setTab] = useState<Tab>('operators')
  const [operators, setOperators] = useState<Operator[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [opName, setOpName] = useState('')
  const [opContact, setOpContact] = useState('')
  const [opEmail, setOpEmail] = useState('')
  const [opPhone, setOpPhone] = useState('')
  const [opCreating, setOpCreating] = useState(false)
  const [opError, setOpError] = useState('')

  const [drFirst, setDrFirst] = useState('')
  const [drLast, setDrLast] = useState('')
  const [drPhone, setDrPhone] = useState('')
  const [drEmail, setDrEmail] = useState('')
  const [drOperatorId, setDrOperatorId] = useState('')
  const [drAssignmentStart, setDrAssignmentStart] = useState('')
  const [drCreating, setDrCreating] = useState(false)
  const [drError, setDrError] = useState('')

  const [vhPlate, setVhPlate] = useState('')
  const [vhType, setVhType] = useState('')
  const [vhBodyType, setVhBodyType] = useState('')
  const [vhOperatorId, setVhOperatorId] = useState('')
  const [vhAssignmentStart, setVhAssignmentStart] = useState('')
  const [vhCreating, setVhCreating] = useState(false)
  const [vhError, setVhError] = useState('')

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.get('/fleet-acquisition/operators').then((r) => setOperators(r.data ?? [])),
      api.get('/fleet-acquisition/drivers').then((r) => setDrivers(r.data ?? [])),
      api.get('/fleet-acquisition/vehicles').then((r) => setVehicles(r.data ?? [])),
    ])
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault()
    setOpError('')
    if (!opName.trim()) {
      setOpError('Name is required')
      return
    }
    setOpCreating(true)
    try {
      await api.post('/fleet-acquisition/operators', {
        name: opName.trim(),
        contactName: opContact.trim() || undefined,
        email: opEmail.trim() || undefined,
        phone: opPhone.trim() || undefined,
      })
      setOpName('')
      setOpContact('')
      setOpEmail('')
      setOpPhone('')
      load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setOpError(ax.response?.data?.message || 'Failed to create operator')
    } finally {
      setOpCreating(false)
    }
  }

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    setDrError('')
    if (!drFirst.trim() || !drLast.trim()) {
      setDrError('First and last name are required')
      return
    }
    setDrCreating(true)
    try {
      await api.post('/fleet-acquisition/drivers', {
        firstName: drFirst.trim(),
        lastName: drLast.trim(),
        phone: drPhone.trim() || undefined,
        email: drEmail.trim() || undefined,
        operatorId: drOperatorId || undefined,
        assignmentStartDate: drAssignmentStart || undefined,
      })
      setDrFirst('')
      setDrLast('')
      setDrPhone('')
      setDrEmail('')
      setDrOperatorId('')
      setDrAssignmentStart('')
      load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setDrError(ax.response?.data?.message || 'Failed to create driver')
    } finally {
      setDrCreating(false)
    }
  }

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setVhError('')
    if (!vhPlate.trim() || !vhType.trim()) {
      setVhError('Plate number and vehicle type are required')
      return
    }
    setVhCreating(true)
    try {
      await api.post('/fleet-acquisition/vehicles', {
        plateNumber: vhPlate.trim(),
        vehicleType: vhType.trim(),
        bodyType: vhBodyType.trim() || undefined,
        operatorId: vhOperatorId || undefined,
        assignmentStartDate: vhAssignmentStart || undefined,
      })
      setVhPlate('')
      setVhType('')
      setVhBodyType('')
      setVhOperatorId('')
      setVhAssignmentStart('')
      load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setVhError(ax.response?.data?.message || 'Failed to create vehicle')
    } finally {
      setVhCreating(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'operators', label: 'Operators', icon: Building2 },
    { id: 'drivers', label: 'Drivers', icon: User },
    { id: 'vehicles', label: 'Vehicles', icon: Truck },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-atc-text">Fleet Acquisition</h1>
        <p className="text-atc-text-muted mt-1">Operators, drivers, and vehicles.</p>
      </div>

      <div className="border-b border-atc-border">
        <nav className="flex gap-1">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  tab === t.id
                    ? 'border-atc-primary text-atc-primary'
                    : 'border-transparent text-atc-text-muted hover:text-atc-text'
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </nav>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-atc-danger">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 rounded-full border-2 border-atc-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'operators' && (
            <>
              <div className="bg-white rounded-lg border border-atc-border p-4">
                <h2 className="font-heading font-semibold text-atc-text mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add operator
                </h2>
                <form onSubmit={handleCreateOperator} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="op-name">Name *</Label>
                    <Input
                      id="op-name"
                      value={opName}
                      onChange={(e) => setOpName(e.target.value)}
                      placeholder="Company name"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="op-contact">Contact name</Label>
                    <Input
                      id="op-contact"
                      value={opContact}
                      onChange={(e) => setOpContact(e.target.value)}
                      placeholder="Contact person"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="op-email">Email</Label>
                    <Input
                      id="op-email"
                      type="email"
                      value={opEmail}
                      onChange={(e) => setOpEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="op-phone">Phone</Label>
                    <Input
                      id="op-phone"
                      value={opPhone}
                      onChange={(e) => setOpPhone(e.target.value)}
                      placeholder="+63..."
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end gap-2">
                    <Button type="submit" disabled={opCreating}>
                      {opCreating ? 'Creating...' : 'Create operator'}
                    </Button>
                    {opError && <span className="text-sm text-atc-danger">{opError}</span>}
                  </div>
                </form>
              </div>
              <div className="bg-white rounded-lg border border-atc-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-atc-border bg-atc-bg-subtle">
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Contact</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Phone</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operators.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-atc-text-muted">
                          No operators. Create one above.
                        </td>
                      </tr>
                    ) : (
                      operators.map((op) => (
                        <tr key={op.id} className="border-b border-atc-border hover:bg-atc-bg-subtle/50">
                          <td className="py-3 px-4 font-medium">{op.name}</td>
                          <td className="py-3 px-4 text-atc-text-muted">{op.contactName ?? '—'}</td>
                          <td className="py-3 px-4 text-atc-text-muted">{op.email ?? '—'}</td>
                          <td className="py-3 px-4 text-atc-text-muted">{op.phone ?? '—'}</td>
                          <td className="py-3 px-4">{op.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'drivers' && (
            <>
              <div className="bg-white rounded-lg border border-atc-border p-4">
                <h2 className="font-heading font-semibold text-atc-text mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add driver
                </h2>
                <form onSubmit={handleCreateDriver} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="dr-first">First name *</Label>
                    <Input
                      id="dr-first"
                      value={drFirst}
                      onChange={(e) => setDrFirst(e.target.value)}
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dr-last">Last name *</Label>
                    <Input
                      id="dr-last"
                      value={drLast}
                      onChange={(e) => setDrLast(e.target.value)}
                      placeholder="Last name"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dr-phone">Phone</Label>
                    <Input
                      id="dr-phone"
                      value={drPhone}
                      onChange={(e) => setDrPhone(e.target.value)}
                      placeholder="+63..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dr-email">Email</Label>
                    <Input
                      id="dr-email"
                      type="email"
                      value={drEmail}
                      onChange={(e) => setDrEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dr-operator">Assign to operator</Label>
                    <select
                      id="dr-operator"
                      className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
                      value={drOperatorId}
                      onChange={(e) => setDrOperatorId(e.target.value)}
                    >
                      <option value="">— None —</option>
                      {operators.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dr-assign-date">Assignment start date</Label>
                    <Input
                      id="dr-assign-date"
                      type="date"
                      value={drAssignmentStart}
                      onChange={(e) => setDrAssignmentStart(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end gap-2">
                    <Button type="submit" disabled={drCreating}>
                      {drCreating ? 'Creating...' : 'Create driver'}
                    </Button>
                    {drError && <span className="text-sm text-atc-danger">{drError}</span>}
                  </div>
                </form>
              </div>
              <div className="bg-white rounded-lg border border-atc-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-atc-border bg-atc-bg-subtle">
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Phone</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Operator</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-atc-text-muted">
                          No drivers. Create one above.
                        </td>
                      </tr>
                    ) : (
                      drivers.map((d) => (
                        <tr key={d.id} className="border-b border-atc-border hover:bg-atc-bg-subtle/50">
                          <td className="py-3 px-4 font-medium">
                            {d.firstName} {d.lastName}
                          </td>
                          <td className="py-3 px-4 text-atc-text-muted">{d.phone ?? '—'}</td>
                          <td className="py-3 px-4 text-atc-text-muted">
                            {d.assignments[0]?.operator?.name ?? '—'}
                          </td>
                          <td className="py-3 px-4">{d.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'vehicles' && (
            <>
              <div className="bg-white rounded-lg border border-atc-border p-4">
                <h2 className="font-heading font-semibold text-atc-text mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add vehicle
                </h2>
                <form onSubmit={handleCreateVehicle} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="vh-plate">Plate number *</Label>
                    <Input
                      id="vh-plate"
                      value={vhPlate}
                      onChange={(e) => setVhPlate(e.target.value)}
                      placeholder="ABC 1234"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vh-type">Vehicle type *</Label>
                    <Input
                      id="vh-type"
                      value={vhType}
                      onChange={(e) => setVhType(e.target.value)}
                      placeholder="4W, 6WCV, 10W"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vh-body">Body type</Label>
                    <Input
                      id="vh-body"
                      value={vhBodyType}
                      onChange={(e) => setVhBodyType(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vh-operator">Assign to operator</Label>
                    <select
                      id="vh-operator"
                      className="flex h-11 w-full rounded-sm border border-atc-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
                      value={vhOperatorId}
                      onChange={(e) => setVhOperatorId(e.target.value)}
                    >
                      <option value="">— None —</option>
                      {operators.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vh-assign-date">Assignment start date</Label>
                    <Input
                      id="vh-assign-date"
                      type="date"
                      value={vhAssignmentStart}
                      onChange={(e) => setVhAssignmentStart(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end gap-2">
                    <Button type="submit" disabled={vhCreating}>
                      {vhCreating ? 'Creating...' : 'Create vehicle'}
                    </Button>
                    {vhError && <span className="text-sm text-atc-danger">{vhError}</span>}
                  </div>
                </form>
              </div>
              <div className="bg-white rounded-lg border border-atc-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-atc-border bg-atc-bg-subtle">
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Plate</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Body type</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Operator</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-atc-text-muted">
                          No vehicles. Create one above.
                        </td>
                      </tr>
                    ) : (
                      vehicles.map((v) => (
                        <tr key={v.id} className="border-b border-atc-border hover:bg-atc-bg-subtle/50">
                          <td className="py-3 px-4 font-medium">{v.plateNumber}</td>
                          <td className="py-3 px-4">{v.vehicleType}</td>
                          <td className="py-3 px-4 text-atc-text-muted">{v.bodyType ?? '—'}</td>
                          <td className="py-3 px-4 text-atc-text-muted">
                            {v.assignments[0]?.operator?.name ?? '—'}
                          </td>
                          <td className="py-3 px-4">{v.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
