import { useEffect, useState, useCallback, useId } from 'react';
import { fetchOperationsDashboard, fetchDispatchLookups, type OperationsDashboardResponse } from '../api/client';
import { TableEmptyState } from '../components/TableEmptyState';
import { IncidentSeverityChip, IncidentStatusChip, StatusChip } from '../components/StatusChip';
import { readSessionJson, writeSessionJson, clearSessionKey } from '../lib/sessionFilters';

function formatDate(s: string | null | undefined) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

function driverName(d: { firstName: string; lastName: string } | undefined) {
  if (!d) return '—';
  return `${d.firstName} ${d.lastName}`.trim() || '—';
}

type OperationsLookups = {
  clients: Array<{ id: string; name: string; code: string; serviceCategories: Array<{ id: string; name: string; code: string }> }>;
  drivers: Array<{ id: string; firstName: string; lastName: string }>;
  operators: Array<{ id: string; name: string }>;
};

const ASSIGNMENT_STATUSES = ['ASSIGNED_PENDING_ACCEPTANCE', 'ACCEPTED', 'DECLINED'];
const TRIP_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const POD_STATUSES = ['POD_NOT_UPLOADED', 'POD_UPLOADED_PENDING_REVIEW', 'POD_VERIFIED', 'POD_REJECTED_NEEDS_REUPLOAD'];
const INCIDENT_STATUSES_FILTER = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const INCIDENT_SEVERITIES_FILTER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

type FilterState = {
  dateFrom?: string;
  dateTo?: string;
  clientAccountId?: string;
  serviceCategoryId?: string;
  operatorId?: string;
  driverId?: string;
  assignmentStatus?: string;
  highLevelTripStatus?: string;
  podStatus?: string;
  originArea?: string;
  destinationArea?: string;
  incidentStatus?: string;
  incidentSeverity?: string;
};

const OPS_FILTERS_KEY = 'ace.filters.operations.v1';

export function OperationsDashboard() {
  const fid = useId();
  const [data, setData] = useState<OperationsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lookups, setLookups] = useState<OperationsLookups | null>(null);
  const [filters, setFilters] = useState<FilterState>(() => {
    const p = readSessionJson<{ filters?: FilterState; applied?: FilterState }>(OPS_FILTERS_KEY);
    return p?.filters ?? {};
  });
  const [applied, setApplied] = useState<FilterState>(() => {
    const p = readSessionJson<{ filters?: FilterState; applied?: FilterState }>(OPS_FILTERS_KEY);
    if (p?.applied != null) return p.applied;
    return p?.filters ?? {};
  });
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchDispatchLookups()
      .then((res) => { if (!cancelled) setLookups(res); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const loadDashboard = useCallback((params: FilterState) => {
    setLoading(true);
    setError(null);
    const q: Record<string, string> = {};
    if (params.dateFrom) q.dateFrom = params.dateFrom;
    if (params.dateTo) q.dateTo = params.dateTo;
    if (params.clientAccountId) q.clientAccountId = params.clientAccountId;
    if (params.serviceCategoryId) q.serviceCategoryId = params.serviceCategoryId;
    if (params.operatorId) q.operatorId = params.operatorId;
    if (params.driverId) q.driverId = params.driverId;
    if (params.assignmentStatus) q.assignmentStatus = params.assignmentStatus;
    if (params.highLevelTripStatus) q.highLevelTripStatus = params.highLevelTripStatus;
    if (params.podStatus) q.podStatus = params.podStatus;
    if (params.originArea) q.originArea = params.originArea;
    if (params.destinationArea) q.destinationArea = params.destinationArea;
    if (params.incidentStatus) q.incidentStatus = params.incidentStatus;
    if (params.incidentSeverity) q.incidentSeverity = params.incidentSeverity;
    fetchOperationsDashboard(q)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDashboard(applied);
  }, [applied, loadDashboard]);

  const onApply = () => {
    const next = { ...filters };
    setApplied(next);
    writeSessionJson(OPS_FILTERS_KEY, { filters: next, applied: next });
  };
  const onReset = () => {
    setFilters({});
    setApplied({});
    clearSessionKey(OPS_FILTERS_KEY);
  };

  const selectedClient = lookups?.clients?.find((c) => c.id === filters.clientAccountId);
  const categories = selectedClient?.serviceCategories ?? [];

  const pageHeader = (
    <div className="page-header">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Operations overview. Filter by date, client, operator, driver, and status to see KPIs and lists.</p>
    </div>
  );

  if (loading && !data) {
    return (
      <div>
        {pageHeader}
        <p className="loading-msg loading-msg--with-spinner" role="status">
          <span className="loading-spinner" aria-hidden />
          Loading operations dashboard…
        </p>
      </div>
    );
  }
  if (error && !data) {
    return (
      <div>
        {pageHeader}
        <div className="error-msg">Error: {error}</div>
      </div>
    );
  }
  if (!data) return null;

  const c = data.counts;

  return (
    <div>
      {pageHeader}
      <section className="panel">
        <div className="panel-header-row">
          <h3 className="panel-title">Filters</h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            {filtersOpen ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className={`page-subtitle ${filtersOpen ? 'page-subtitle--spaced' : 'page-subtitle--spaced-sm'}`}>
          Choose date range, parties, statuses, and areas, then Apply to refresh KPIs and tables below.
        </p>
        {filtersOpen && (
        <>
        <p className="filter-toolbar-hint">Clear all removes every filter at once; Apply runs the search with your current choices.</p>
        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-date-from`}>Date from</label>
            <input id={`${fid}-date-from`} type="date" className="filter-input" value={filters.dateFrom ?? ''} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))} />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-date-to`}>Date to</label>
            <input id={`${fid}-date-to`} type="date" className="filter-input" value={filters.dateTo ?? ''} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))} />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-client`}>Client</label>
            <select id={`${fid}-client`} className="filter-select" value={filters.clientAccountId ?? ''} onChange={(e) => setFilters((f) => ({ ...f, clientAccountId: e.target.value || undefined, serviceCategoryId: undefined }))}>
              <option value="">All</option>
              {lookups?.clients?.map((client) => (<option key={client.id} value={client.id}>{client.name}</option>))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-category`}>Service category</label>
            <select id={`${fid}-category`} className="filter-select" value={filters.serviceCategoryId ?? ''} onChange={(e) => setFilters((f) => ({ ...f, serviceCategoryId: e.target.value || undefined }))} style={{ minWidth: 180 }}>
              <option value="">All</option>
              {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-operator`}>Operator</label>
            <select id={`${fid}-operator`} className="filter-select" value={filters.operatorId ?? ''} onChange={(e) => setFilters((f) => ({ ...f, operatorId: e.target.value || undefined }))}>
              <option value="">All</option>
              {lookups?.operators?.map((op) => (<option key={op.id} value={op.id}>{op.name}</option>))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-driver`}>Driver</label>
            <select id={`${fid}-driver`} className="filter-select" value={filters.driverId ?? ''} onChange={(e) => setFilters((f) => ({ ...f, driverId: e.target.value || undefined }))} style={{ minWidth: 160 }}>
              <option value="">All</option>
              {lookups?.drivers?.map((d) => (<option key={d.id} value={d.id}>{driverName(d)}</option>))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-assign-status`}>Assignment status</label>
            <select id={`${fid}-assign-status`} className="filter-select" value={filters.assignmentStatus ?? ''} onChange={(e) => setFilters((f) => ({ ...f, assignmentStatus: e.target.value || undefined }))}>
              <option value="">All</option>
              {ASSIGNMENT_STATUSES.map((s) => (<option key={s} value={s}>{s.replace(/_/g, ' ')}</option>))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-trip-status`}>Trip status</label>
            <select id={`${fid}-trip-status`} className="filter-select" value={filters.highLevelTripStatus ?? ''} onChange={(e) => setFilters((f) => ({ ...f, highLevelTripStatus: e.target.value || undefined }))}>
              <option value="">All</option>
              {TRIP_STATUSES.map((s) => (<option key={s} value={s}>{s.replace(/_/g, ' ')}</option>))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-pod`}>POD status</label>
            <select id={`${fid}-pod`} className="filter-select" value={filters.podStatus ?? ''} onChange={(e) => setFilters((f) => ({ ...f, podStatus: e.target.value || undefined }))}>
              <option value="">All</option>
              {POD_STATUSES.map((s) => (<option key={s} value={s}>{s.replace(/_/g, ' ')}</option>))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-origin`}>Origin area</label>
            <input id={`${fid}-origin`} type="text" className="filter-input" placeholder="e.g. NCR" value={filters.originArea ?? ''} onChange={(e) => setFilters((f) => ({ ...f, originArea: e.target.value || undefined }))} style={{ minWidth: 100 }} />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-dest`}>Destination area</label>
            <input id={`${fid}-dest`} type="text" className="filter-input" placeholder="e.g. NCR" value={filters.destinationArea ?? ''} onChange={(e) => setFilters((f) => ({ ...f, destinationArea: e.target.value || undefined }))} style={{ minWidth: 100 }} />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-inc-status`}>Incident status</label>
            <select id={`${fid}-inc-status`} className="filter-select" value={filters.incidentStatus ?? ''} onChange={(e) => setFilters((f) => ({ ...f, incidentStatus: e.target.value || undefined }))}>
              <option value="">All</option>
              {INCIDENT_STATUSES_FILTER.map((s) => (<option key={s} value={s}>{s.replace(/_/g, ' ')}</option>))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-inc-sev`}>Incident severity</label>
            <select id={`${fid}-inc-sev`} className="filter-select" value={filters.incidentSeverity ?? ''} onChange={(e) => setFilters((f) => ({ ...f, incidentSeverity: e.target.value || undefined }))}>
              <option value="">All</option>
              {INCIDENT_SEVERITIES_FILTER.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div className="filters-actions">
            <button type="button" onClick={onApply} className="btn btn-primary">Apply</button>
            <button type="button" onClick={onReset} className="btn btn-secondary">Clear all</button>
          </div>
        </div>
        </>
        )}
      </section>

      <section className="panel">
        <h3 className="panel-title">KPI summary</h3>
        <p className="page-subtitle page-subtitle--spaced">
          Counts reflect your applied filters. Use Apply after changing criteria.
        </p>
        {loading && (
          <p className="updating-msg updating-msg--spaced loading-msg--with-spinner" role="status">
            <span className="loading-spinner" aria-hidden />
            Updating…
          </p>
        )}
        <div className="dashboard-kpi-row">
          <div className="kpi-tile kpi-tile--primary"><div className="kpi-value">{c.pendingAcceptance}</div><div className="kpi-label">Pending acceptance</div></div>
          <div className="kpi-tile kpi-tile--primary"><div className="kpi-value">{c.acceptedOngoing}</div><div className="kpi-label">Accepted / ongoing</div></div>
          <div className="kpi-tile kpi-tile--success"><div className="kpi-value">{c.completed}</div><div className="kpi-label">Completed</div></div>
          <div className="kpi-tile kpi-tile--teal"><div className="kpi-value">{c.podUploadedPendingReview}</div><div className="kpi-label">POD pending review</div></div>
          <div className="kpi-tile kpi-tile--warning"><div className="kpi-value">{c.podRejected}</div><div className="kpi-label">POD rejected</div></div>
          <div className="kpi-tile kpi-tile--teal"><div className="kpi-value">{c.podVerified}</div><div className="kpi-label">POD verified</div></div>
          <div className="kpi-tile kpi-tile--teal"><div className="kpi-value">{c.financeDocReceived}</div><div className="kpi-label">Finance doc received</div></div>
          <div className="kpi-tile kpi-tile--neutral"><div className="kpi-value">{c.noUpdateCallTime}</div><div className="kpi-label">No update (call time +3h)</div></div>
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">Pending acceptance</h3>
        {data.pendingAcceptanceTrips.length === 0 ? (
          <TableEmptyState
            message="No trips pending driver acceptance."
            hint="When drivers are assigned but have not accepted, they appear here. Use Dispatch to manage assignments."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Internal ref</th><th>Runsheet date</th><th>Call time</th><th>Driver</th><th>Category</th></tr></thead>
              <tbody>
                {data.pendingAcceptanceTrips.map((row) => (
                  <tr key={row.id}>
                    <td>{row.internalRef}</td><td>{formatDate(row.runsheetDate)}</td><td>{formatDate(row.callTime)}</td>
                    <td>{driverName(row.assignedDriver)}</td><td>{row.serviceCategory?.name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h3 className="panel-title">No update (call time +3h)</h3>
        {data.noUpdateCallTimeTrips.length === 0 ? (
          <TableEmptyState
            message="No trips are past call time without a driver update."
            hint="This list helps catch silent trips. Adjust dashboard filters if you expected rows here."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Internal ref</th><th>Call time</th><th>Last driver event</th><th>Driver</th></tr></thead>
              <tbody>
                {data.noUpdateCallTimeTrips.map((row) => (
                  <tr key={row.id}>
                    <td>{row.internalRef}</td><td>{formatDate(row.callTime)}</td><td>{formatDate(row.lastDriverEventAt)}</td><td>{driverName(row.assignedDriver)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h3 className="panel-title">Open incidents</h3>
        {data.openIncidents.length === 0 ? (
          <TableEmptyState
            message="No open incidents for this view."
            hint="Report and track incidents from the Incidents page when something goes wrong on a trip."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Trip ref</th><th>Type</th><th>Severity</th><th>Status</th><th>Reported at</th><th>Description</th></tr></thead>
              <tbody>
                {data.openIncidents.map((row) => (
                  <tr key={row.id}>
                    <td>{row.trip?.internalRef ?? '—'}</td><td><StatusChip tone="neutral">{row.incidentType}</StatusChip></td><td><IncidentSeverityChip severity={row.severity} /></td><td><IncidentStatusChip status={row.status} /></td>
                    <td>{formatDate(row.reportedAt)}</td><td>{row.description ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
