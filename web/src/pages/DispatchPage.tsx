import { useEffect, useState, useCallback } from 'react';
import { getTrips, createTrip, fetchDispatchLookups } from '../api/client';

type Trip = {
  id: string;
  internalRef: string;
  runsheetDate: string;
  callTime: string;
  assignmentStatus: string;
  highLevelTripStatus: string;
  podStatus: string;
  originArea: string;
  destinationArea: string;
  vehicleType: string;
  assignedDriver?: { id: string; firstName: string; lastName: string };
  assignedVehicle?: { id: string; plateNumber: string; vehicleType: string };
  serviceCategory?: { id: string; name: string; code: string };
  clientAccount?: { id: string; name: string; code: string };
};

type LookupClient = {
  id: string;
  name: string;
  code: string;
  serviceCategories: Array<{ id: string; name: string; code: string }>;
};

type LookupDriver = { id: string; firstName: string; lastName: string };
type LookupVehicle = { id: string; plateNumber: string; vehicleType: string };

export function DispatchPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [lookups, setLookups] = useState<{
    clients: LookupClient[];
    drivers: LookupDriver[];
    vehicles: LookupVehicle[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createClientId, setCreateClientId] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState<{ dateFrom?: string; dateTo?: string; clientAccountId?: string }>({});
  const [applied, setApplied] = useState<{ dateFrom?: string; dateTo?: string; clientAccountId?: string }>({});

  const loadLookups = useCallback(async () => {
    try {
      const data = await fetchDispatchLookups();
      setLookups(data);
    } catch {
      setLookups({ clients: [], drivers: [], vehicles: [] });
    }
  }, []);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (applied.dateFrom) params.dateFrom = applied.dateFrom;
      if (applied.dateTo) params.dateTo = applied.dateTo;
      if (applied.clientAccountId) params.clientAccountId = applied.clientAccountId;
      const data = await getTrips(params);
      setTrips(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [applied.dateFrom, applied.dateTo, applied.clientAccountId]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const onApply = () => setApplied({ ...filters });
  const onReset = () => {
    setFilters({});
    setApplied({});
  };

  const handleCreateTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const clientAccountId = (form.querySelector('[name="clientAccountId"]') as HTMLSelectElement).value;
    const serviceCategoryId = (form.querySelector('[name="serviceCategoryId"]') as HTMLSelectElement).value;
    const runsheetDate = (form.querySelector('[name="runsheetDate"]') as HTMLInputElement).value;
    const callTime = (form.querySelector('[name="callTime"]') as HTMLInputElement).value;
    const originArea = (form.querySelector('[name="originArea"]') as HTMLInputElement).value.trim();
    const destinationArea = (form.querySelector('[name="destinationArea"]') as HTMLInputElement).value.trim();
    const vehicleType = (form.querySelector('[name="vehicleType"]') as HTMLInputElement).value.trim();
    const assignedDriverId = (form.querySelector('[name="assignedDriverId"]') as HTMLSelectElement).value;
    const assignedVehicleId = (form.querySelector('[name="assignedVehicleId"]') as HTMLSelectElement).value;
    if (!clientAccountId || !serviceCategoryId || !runsheetDate || !callTime || !originArea || !destinationArea || !vehicleType || !assignedDriverId || !assignedVehicleId) {
      setSubmitError('Fill required fields: client, category, runsheet date, call time, origin, destination, vehicle type, driver, vehicle.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createTrip({
        clientAccountId,
        serviceCategoryId,
        runsheetDate,
        callTime: runsheetDate && callTime ? `${runsheetDate}T${callTime}:00.000Z` : callTime,
        originArea,
        destinationArea,
        vehicleType,
        assignedDriverId,
        assignedVehicleId,
      });
      setShowCreate(false);
      loadTrips();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Create trip failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (s: string | null | undefined) => {
    if (!s) return '—';
    try {
      return new Date(s).toLocaleDateString();
    } catch {
      return s;
    }
  };

  const formatTime = (s: string | null | undefined) => {
    if (!s) return '—';
    try {
      const d = new Date(s);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return s;
    }
  };

  const selectedClient = lookups?.clients?.find((c) => c.id === createClientId);
  const categories = selectedClient?.serviceCategories ?? [];

  return (
    <div className="dispatch-page">
      <div className="page-header">
        <h1 className="page-title">Dispatch</h1>
        <p className="page-subtitle">View and create trips. Filter by date and client.</p>
      </div>
      <section className="panel">
        <div className="panel-header-row">
          <h3 className="panel-title">Filters</h3>
        </div>
        <div className="filters-row" style={{ flexWrap: 'wrap' }}>
          <div className="filter-group">
            <label className="filter-label">Date from</label>
            <input
              type="date"
              className="filter-input"
              value={filters.dateFrom ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">Date to</label>
            <input
              type="date"
              className="filter-input"
              value={filters.dateTo ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">Client</label>
            <select
              className="filter-select"
              value={filters.clientAccountId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, clientAccountId: e.target.value || undefined }))}
            >
              <option value="">All</option>
              {(lookups?.clients ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <button type="button" className="btn btn-primary" onClick={onApply}>Apply</button>
          <button type="button" className="btn btn-secondary" onClick={onReset}>Reset</button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <h2 className="section-title">Trips</h2>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? 'Cancel' : 'Create trip'}
          </button>
        </div>

        {showCreate && lookups && (
          <form onSubmit={handleCreateTrip} className="form-block">
            <h3 className="panel-title">New trip</h3>
            <div className="form-grid">
              <div className="filter-group">
                <label className="filter-label">Client *</label>
                <select
                  name="clientAccountId"
                  className="filter-select"
                  required
                  value={createClientId}
                  onChange={(e) => setCreateClientId(e.target.value)}
                >
                  <option value="">Select client</option>
                  {lookups.clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Service category *</label>
                <select name="serviceCategoryId" className="filter-select" required>
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Runsheet date *</label>
                <input
                  type="date"
                  name="runsheetDate"
                  className="filter-input"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">Call time *</label>
                <input
                  type="time"
                  name="callTime"
                  className="filter-input"
                  required
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">Origin area *</label>
                <input name="originArea" className="filter-input" required placeholder="e.g. NCR" />
              </div>
              <div className="filter-group">
                <label className="filter-label">Destination area *</label>
                <input name="destinationArea" className="filter-input" required placeholder="e.g. Region IV" />
              </div>
              <div className="filter-group">
                <label className="filter-label">Vehicle type *</label>
                <input name="vehicleType" className="filter-input" required placeholder="e.g. 4W" />
              </div>
              <div className="filter-group">
                <label className="filter-label">Driver *</label>
                <select name="assignedDriverId" className="filter-select" required>
                  <option value="">Select driver</option>
                  {lookups.drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Vehicle *</label>
                <select name="assignedVehicleId" className="filter-select" required>
                  <option value="">Select vehicle</option>
                  {lookups.vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.plateNumber} ({v.vehicleType})</option>
                  ))}
                </select>
              </div>
            </div>
            {submitError && <p className="login-error">{submitError}</p>}
            <button type="submit" disabled={submitting} className="btn btn-primary">Create trip</button>
          </form>
        )}

        {error && <p className="login-error">{error}</p>}
        {loading ? (
          <p className="updating-msg">Loading trips…</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Runsheet date</th>
                  <th>Call time</th>
                  <th>Origin → Dest</th>
                  <th>Driver</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>POD</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr><td colSpan={8} className="table-empty">No trips. Create one or adjust filters.</td></tr>
                ) : (
                  trips.map((t) => (
                    <tr key={t.id}>
                      <td>{t.internalRef}</td>
                      <td>{formatDate(t.runsheetDate)}</td>
                      <td>{formatTime(t.callTime)}</td>
                      <td>{t.originArea} → {t.destinationArea}</td>
                      <td>{t.assignedDriver ? `${t.assignedDriver.firstName} ${t.assignedDriver.lastName}` : '—'}</td>
                      <td>{t.assignedVehicle ? `${t.assignedVehicle.plateNumber}` : '—'}</td>
                      <td>{t.assignmentStatus} / {t.highLevelTripStatus}</td>
                      <td>{t.podStatus}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
