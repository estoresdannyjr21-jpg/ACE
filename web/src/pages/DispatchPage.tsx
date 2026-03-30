import { useEffect, useState, useCallback, useId } from 'react';
import { getTrips, createTrip, fetchDispatchLookups, type TripListItem } from '../api/client';
import { TableEmptyState } from '../components/TableEmptyState';
import { readSessionJson, writeSessionJson, clearSessionKey } from '../lib/sessionFilters';
import { useToast } from '../context/ToastContext';
import { StatusChip, assignmentStatusTone, humanizeEnum, podStatusTone, tripHighLevelTone } from '../components/StatusChip';

const TRIP_PAGE_SIZES = [25, 50, 100] as const;

type LookupClient = {
  id: string;
  name: string;
  code: string;
  serviceCategories: Array<{ id: string; name: string; code: string }>;
};

type LookupDriver = { id: string; firstName: string; lastName: string };
type LookupVehicle = { id: string; plateNumber: string; vehicleType: string };

type TripFieldOptions = {
  originAreas: string[];
  destinationAreas: string[];
  vehicleTypes: string[];
};

const DISPATCH_FILTERS_KEY = 'ace.filters.dispatch.v1';

type DispatchPersist = {
  applied?: { dateFrom?: string; dateTo?: string; clientAccountId?: string };
  filters?: { dateFrom?: string; dateTo?: string; clientAccountId?: string };
  tripPage?: number;
  tripPageSize?: number;
};

function readDispatchPersist(): DispatchPersist | null {
  return readSessionJson<DispatchPersist>(DISPATCH_FILTERS_KEY);
}

export function DispatchPage() {
  const toast = useToast();
  const listFid = useId();
  const createFid = useId();
  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [tripTotalCount, setTripTotalCount] = useState(0);
  const [tripPage, setTripPage] = useState(() => readDispatchPersist()?.tripPage ?? 0);
  const [tripPageSize, setTripPageSize] = useState(() => {
    const n = readDispatchPersist()?.tripPageSize;
    return n && [25, 50, 100].includes(n) ? n : 50;
  });
  const [lookups, setLookups] = useState<{
    clients: LookupClient[];
    drivers: LookupDriver[];
    vehicles: LookupVehicle[];
    tripFieldOptions?: TripFieldOptions;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createClientId, setCreateClientId] = useState('');
  const [createOriginArea, setCreateOriginArea] = useState('');
  const [createDestinationArea, setCreateDestinationArea] = useState('');
  const [createVehicleType, setCreateVehicleType] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState<{ dateFrom?: string; dateTo?: string; clientAccountId?: string }>(() => {
    const p = readDispatchPersist();
    const a = p?.applied ?? p?.filters;
    return a ? { ...a } : {};
  });
  const [applied, setApplied] = useState<{ dateFrom?: string; dateTo?: string; clientAccountId?: string }>(() => {
    const p = readDispatchPersist();
    const a = p?.applied ?? p?.filters;
    return a ? { ...a } : {};
  });

  const loadLookups = useCallback(async () => {
    try {
      const data = await fetchDispatchLookups();
      setLookups(data);
    } catch {
      setLookups({
        clients: [],
        drivers: [],
        vehicles: [],
        tripFieldOptions: { originAreas: [], destinationAreas: [], vehicleTypes: [] },
      });
    }
  }, []);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        limit: String(tripPageSize),
        offset: String(tripPage * tripPageSize),
      };
      if (applied.dateFrom) params.dateFrom = applied.dateFrom;
      if (applied.dateTo) params.dateTo = applied.dateTo;
      if (applied.clientAccountId) params.clientAccountId = applied.clientAccountId;
      const data = await getTrips(params);
      setTrips(data.items);
      setTripTotalCount(data.totalCount);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not load trips. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [applied.dateFrom, applied.dateTo, applied.clientAccountId, tripPage, tripPageSize]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  useEffect(() => {
    writeSessionJson(DISPATCH_FILTERS_KEY, { applied, tripPage, tripPageSize });
  }, [applied, tripPage, tripPageSize]);

  const onApply = () => {
    const next = { ...filters };
    setTripPage(0);
    setApplied(next);
  };
  const onReset = () => {
    setFilters({});
    setApplied({});
    setTripPage(0);
    clearSessionKey(DISPATCH_FILTERS_KEY);
  };

  const handleCreateTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const clientAccountId = (form.querySelector('[name="clientAccountId"]') as HTMLSelectElement).value;
    const serviceCategoryId = (form.querySelector('[name="serviceCategoryId"]') as HTMLSelectElement).value;
    const runsheetDate = (form.querySelector('[name="runsheetDate"]') as HTMLInputElement).value;
    const callTime = (form.querySelector('[name="callTime"]') as HTMLInputElement).value;
    const originArea = createOriginArea.trim();
    const destinationArea = createDestinationArea.trim();
    const vehicleType = createVehicleType.trim();
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
      loadLookups();
      loadTrips();
      toast.show('Trip created', { variant: 'success' });
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
  const tripOpts = lookups?.tripFieldOptions;
  const originChoices = tripOpts?.originAreas ?? [];
  const destChoices = tripOpts?.destinationAreas ?? [];
  const vehicleTypeChoices = tripOpts?.vehicleTypes ?? [];

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
        <p className="page-subtitle page-subtitle--spaced">
          Limit trips by runsheet date range and client, then Apply. Clear all resets dates and client.
        </p>
        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${listFid}-date-from`}>Date from</label>
            <input
              id={`${listFid}-date-from`}
              type="date"
              className="filter-input"
              value={filters.dateFrom ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${listFid}-date-to`}>Date to</label>
            <input
              id={`${listFid}-date-to`}
              type="date"
              className="filter-input"
              value={filters.dateTo ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${listFid}-client`}>Client</label>
            <select
              id={`${listFid}-client`}
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
          <div className="filters-actions">
            <button type="button" className="btn btn-primary" onClick={onApply}>Apply</button>
            <button type="button" className="btn btn-secondary" onClick={onReset}>Clear all</button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <h3 className="panel-title">Create trip</h3>
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
            <div className="form-grid">
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${createFid}-client`}>Client <span className="text-required" aria-hidden>*</span></label>
                <select
                  id={`${createFid}-client`}
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
                <label className="filter-label" htmlFor={`${createFid}-category`}>Service category <span className="text-required" aria-hidden>*</span></label>
                <select id={`${createFid}-category`} name="serviceCategoryId" className="filter-select" required>
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${createFid}-runsheet`}>Runsheet date <span className="text-required" aria-hidden>*</span></label>
                <input
                  id={`${createFid}-runsheet`}
                  type="date"
                  name="runsheetDate"
                  className="filter-input"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${createFid}-call`}>Call time <span className="text-required" aria-hidden>*</span></label>
                <input
                  id={`${createFid}-call`}
                  type="time"
                  name="callTime"
                  className="filter-input"
                  required
                />
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${createFid}-origin`}>Origin area <span className="text-required" aria-hidden>*</span></label>
                {originChoices.length > 0 ? (
                  <select
                    id={`${createFid}-origin`}
                    className="filter-select"
                    required
                    value={createOriginArea}
                    onChange={(e) => setCreateOriginArea(e.target.value)}
                  >
                    <option value="">Select origin area</option>
                    {originChoices.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`${createFid}-origin`}
                    className="filter-input"
                    required
                    value={createOriginArea}
                    onChange={(e) => setCreateOriginArea(e.target.value)}
                    placeholder="No prior trips — type area (e.g. NCR)"
                  />
                )}
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${createFid}-dest`}>Destination area <span className="text-required" aria-hidden>*</span></label>
                {destChoices.length > 0 ? (
                  <select
                    id={`${createFid}-dest`}
                    className="filter-select"
                    required
                    value={createDestinationArea}
                    onChange={(e) => setCreateDestinationArea(e.target.value)}
                  >
                    <option value="">Select destination area</option>
                    {destChoices.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`${createFid}-dest`}
                    className="filter-input"
                    required
                    value={createDestinationArea}
                    onChange={(e) => setCreateDestinationArea(e.target.value)}
                    placeholder="No prior trips — type area"
                  />
                )}
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${createFid}-vtype`}>Vehicle type <span className="text-required" aria-hidden>*</span></label>
                {vehicleTypeChoices.length > 0 ? (
                  <select
                    id={`${createFid}-vtype`}
                    className="filter-select"
                    required
                    value={createVehicleType}
                    onChange={(e) => setCreateVehicleType(e.target.value)}
                  >
                    <option value="">Select vehicle type</option>
                    {vehicleTypeChoices.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`${createFid}-vtype`}
                    className="filter-input"
                    required
                    value={createVehicleType}
                    onChange={(e) => setCreateVehicleType(e.target.value)}
                    placeholder="Type vehicle type or pick a vehicle below first"
                  />
                )}
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${createFid}-driver`}>Driver <span className="text-required" aria-hidden>*</span></label>
                <select id={`${createFid}-driver`} name="assignedDriverId" className="filter-select" required>
                  <option value="">Select driver</option>
                  {lookups.drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${createFid}-vehicle`}>Vehicle <span className="text-required" aria-hidden>*</span></label>
                <select
                  id={`${createFid}-vehicle`}
                  name="assignedVehicleId"
                  className="filter-select"
                  required
                  onChange={(e) => {
                    const v = lookups.vehicles.find((x) => x.id === e.target.value);
                    if (v) setCreateVehicleType(v.vehicleType);
                  }}
                >
                  <option value="">Select vehicle</option>
                  {lookups.vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.plateNumber} ({v.vehicleType})</option>
                  ))}
                </select>
              </div>
            </div>
            {submitError && <p className="login-error" role="alert">{submitError}</p>}
            <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Creating…' : 'Create trip'}</button>
          </form>
        )}
      </section>

      <section className="panel">
        <h3 className="panel-title">Trips</h3>
        <p className="page-subtitle page-subtitle--spaced">
          Rows reflect applied filters above.
        </p>
        {error && <p className="login-error">{error}</p>}
        {loading ? (
          <p className="updating-msg loading-msg--with-spinner" role="status">
            <span className="loading-spinner" aria-hidden />
            Loading trips…
          </p>
        ) : !error && trips.length === 0 ? (
          <TableEmptyState
            message="No trips match your filters."
            hint="Try a wider date range or a different client, or create a new trip for this period."
            actionLabel="Create trip"
            onAction={() => setShowCreate(true)}
          />
        ) : trips.length > 0 ? (
          <>
            <div className="ledger-toolbar">
              <span className="text-muted">
                Showing {trips.length === 0 ? 0 : tripPage * tripPageSize + 1}
                –
                {tripPage * tripPageSize + trips.length} of {tripTotalCount}
              </span>
              <select
                className="filter-select"
                value={tripPageSize}
                onChange={(e) => {
                  setTripPageSize(Number(e.target.value));
                  setTripPage(0);
                }}
                style={{ width: 80 }}
                aria-label="Rows per page"
              >
                {TRIP_PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-muted">per page</span>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={tripPage === 0}
                onClick={() => setTripPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={(tripPage + 1) * tripPageSize >= tripTotalCount}
                onClick={() => setTripPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
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
                  {trips.map((t) => (
                    <tr key={t.id}>
                      <td>{t.internalRef}</td>
                      <td>{formatDate(t.runsheetDate)}</td>
                      <td>{formatTime(t.callTime)}</td>
                      <td>{t.originArea} → {t.destinationArea}</td>
                      <td>{t.assignedDriver ? `${t.assignedDriver.firstName} ${t.assignedDriver.lastName}` : '—'}</td>
                      <td>{t.assignedVehicle ? `${t.assignedVehicle.plateNumber}` : '—'}</td>
                      <td>
                        <span className="status-chip-inline">
                          <StatusChip tone={assignmentStatusTone(t.assignmentStatus)}>{humanizeEnum(t.assignmentStatus)}</StatusChip>
                          <StatusChip tone={tripHighLevelTone(t.highLevelTripStatus)}>{humanizeEnum(t.highLevelTripStatus)}</StatusChip>
                        </span>
                      </td>
                      <td><StatusChip tone={podStatusTone(t.podStatus)}>{humanizeEnum(t.podStatus)}</StatusChip></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
