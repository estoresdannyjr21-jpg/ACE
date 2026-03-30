import { useEffect, useState, useCallback, useId } from 'react';
import { fetchFinanceDashboard, fetchFinanceLookups, type FinanceDashboardResponse } from '../api/client';
import { TableEmptyState } from '../components/TableEmptyState';
import { PodStatusChip, PayoutStatusChip } from '../components/StatusChip';
import { readSessionJson, writeSessionJson, clearSessionKey } from '../lib/sessionFilters';

type KpiVariant = 'primary' | 'teal' | 'success' | 'warning' | 'neutral';
const KPI_GROUPS: { title: string; variant?: KpiVariant; tiles: { label: string; key: keyof FinanceDashboardResponse['counts'] }[] }[] = [
  {
    title: 'Doc & compute',
    variant: 'teal',
    tiles: [
      { label: 'POD verified, doc not received', key: 'podVerifiedNotReceived' },
      { label: 'Doc received, not computed', key: 'docReceivedNotComputed' },
    ],
  },
  {
    title: 'Billing (AR)',
    variant: 'primary',
    tiles: [
      { label: 'Ready to bill', key: 'billingReadyToBill' },
      { label: 'Billed', key: 'billingBilled' },
      { label: 'Paid', key: 'billingPaid' },
    ],
  },
  {
    title: 'Payout (AP)',
    variant: 'success',
    tiles: [
      { label: 'Ready for payout', key: 'payoutReadyForPayout' },
      { label: 'In batch', key: 'payoutInBatch' },
      { label: 'Fin mgr approved', key: 'payoutFinMgrApproved' },
      { label: 'CFO approved', key: 'payoutCfoApproved' },
      { label: 'Released', key: 'payoutReleased' },
      { label: 'Paid', key: 'payoutPaid' },
    ],
  },
  {
    title: 'Reimbursables & overrides',
    variant: 'warning',
    tiles: [
      { label: 'Reimbursables pending approval', key: 'reimbursablesPendingApproval' },
      { label: 'Reimbursables approved, pending batch', key: 'reimbursablesApprovedPendingBatch' },
      { label: 'Override requests pending CFO', key: 'overridesPendingCfo' },
    ],
  },
  {
    title: 'Subcontractor deadlines',
    variant: 'neutral',
    tiles: [
      { label: 'Deadline expiring in 7 days', key: 'subconExpiringSoon' },
      { label: 'Deadline expired (not overridden)', key: 'subconExpiredBlocked' },
    ],
  },
];

function formatDate(s: string | null | undefined) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString();
  } catch {
    return s;
  }
}

function driverName(d: { firstName: string; lastName: string } | undefined) {
  if (!d) return '—';
  return `${d.firstName} ${d.lastName}`.trim() || '—';
}

type FilterState = {
  dateFrom?: string;
  dateTo?: string;
  clientAccountId?: string;
  serviceCategoryId?: string;
  operatorId?: string;
};

const FIN_FILTERS_KEY = 'ace.filters.financeDashboard.v1';

export function FinanceDashboard() {
  const fid = useId();
  const [data, setData] = useState<FinanceDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lookups, setLookups] = useState<{ clients: Array<{ id: string; name: string; code: string; serviceCategories: Array<{ id: string; name: string; code: string }> }>; operators: Array<{ id: string; name: string }> } | null>(null);
  const [filters, setFilters] = useState<FilterState>(() => {
    const p = readSessionJson<{ filters?: FilterState; applied?: FilterState }>(FIN_FILTERS_KEY);
    return p?.filters ?? {};
  });
  const [applied, setApplied] = useState<FilterState>(() => {
    const p = readSessionJson<{ filters?: FilterState; applied?: FilterState }>(FIN_FILTERS_KEY);
    if (p?.applied != null) return p.applied;
    return p?.filters ?? {};
  });
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchFinanceLookups()
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
    fetchFinanceDashboard(q)
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
    writeSessionJson(FIN_FILTERS_KEY, { filters: next, applied: next });
  };
  const onReset = () => {
    setFilters({});
    setApplied({});
    clearSessionKey(FIN_FILTERS_KEY);
  };

  const selectedClient = lookups?.clients?.find((c) => c.id === filters.clientAccountId);
  const categories = selectedClient?.serviceCategories ?? [];

  if (loading && !data) {
    return (
      <section className="panel">
        <p className="loading-msg loading-msg--with-spinner" role="status">
          <span className="loading-spinner" aria-hidden />
          Loading dashboard…
        </p>
      </section>
    );
  }
  if (error && !data) {
    return (
      <section className="panel">
        <div className="error-msg">Error: {error}</div>
      </section>
    );
  }
  if (!data) return null;

  const c = data.counts;

  return (
    <div>
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
          Date range, client, category, and operator scope the dashboard. Apply to reload.
        </p>
        {filtersOpen && (
        <>
        <p className="filter-toolbar-hint">Clear all resets every filter; Apply refreshes KPIs with the criteria you set.</p>
        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-date-from`}>Date from</label>
            <input
              id={`${fid}-date-from`}
              type="date"
              className="filter-input"
              value={filters.dateFrom ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-date-to`}>Date to</label>
            <input
              id={`${fid}-date-to`}
              type="date"
              className="filter-input"
              value={filters.dateTo ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-client`}>Client</label>
            <select
              id={`${fid}-client`}
              className="filter-select"
              value={filters.clientAccountId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, clientAccountId: e.target.value || undefined, serviceCategoryId: undefined }))}
            >
              <option value="">All</option>
              {lookups?.clients?.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-category`}>Service category</label>
            <select
              id={`${fid}-category`}
              className="filter-select"
              value={filters.serviceCategoryId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, serviceCategoryId: e.target.value || undefined }))}
              style={{ minWidth: 180 }}
            >
              <option value="">All</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-operator`}>Operator</label>
            <select
              id={`${fid}-operator`}
              className="filter-select"
              value={filters.operatorId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, operatorId: e.target.value || undefined }))}
            >
              <option value="">All</option>
              {lookups?.operators?.map((op) => (
                <option key={op.id} value={op.id}>{op.name}</option>
              ))}
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
          Document, billing, payout, and subcontractor counts for the applied filters.
        </p>
        {loading && (
          <p className="updating-msg updating-msg--spaced loading-msg--with-spinner" role="status">
            <span className="loading-spinner" aria-hidden />
            Updating…
          </p>
        )}
        <div className="kpi-grid">
          {KPI_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="kpi-group-title">{group.title}</div>
              <div className="dashboard-kpi-row dashboard-kpi-row--compact">
                {group.tiles.map((t) => (
                  <div key={t.key} className={`kpi-tile kpi-tile--${group.variant ?? 'neutral'}`}>
                    <div className="kpi-value">{c[t.key] ?? 0}</div>
                    <div className="kpi-label">{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">POD verified, no Finance doc</h3>
        {data.podVerifiedNotReceivedList.length === 0 ? (
          <TableEmptyState
            message="No trips are waiting for a finance document after POD verification."
            hint="When POD is verified but finance has not received paperwork, trips appear here."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Internal ref</th>
                  <th>Runsheet date</th>
                  <th>Driver</th>
                  <th>POD status</th>
                </tr>
              </thead>
              <tbody>
                {data.podVerifiedNotReceivedList.map((row) => (
                  <tr key={row.id}>
                    <td>{row.internalRef}</td>
                    <td>{formatDate(row.runsheetDate)}</td>
                    <td>{driverName(row.assignedDriver)}</td>
                    <td>{row.podStatus ? <PodStatusChip status={row.podStatus} /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h3 className="panel-title">Doc received, not computed</h3>
        {data.docReceivedNotComputedList.length === 0 ? (
          <TableEmptyState
            message="No trips have finance documents waiting to be computed."
            hint="After documents are received, amounts still need to be computed before billing steps."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Internal ref</th>
                  <th>Runsheet date</th>
                  <th>Doc received at</th>
                  <th>Driver</th>
                </tr>
              </thead>
              <tbody>
                {data.docReceivedNotComputedList.map((row) => (
                  <tr key={row.id}>
                    <td>{row.internalRef}</td>
                    <td>{formatDate(row.runsheetDate)}</td>
                    <td>{formatDate(row.finance?.financeDocReceivedAt)}</td>
                    <td>{driverName(row.assignedDriver)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h3 className="panel-title">Override requests pending</h3>
        {data.overridesPendingList.length === 0 ? (
          <TableEmptyState
            message="No payout override requests are pending."
            hint="Override workflows show here when a trip needs finance review before payout."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Internal ref</th>
                  <th>Runsheet date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.overridesPendingList.map((row) => (
                  <tr key={row.id}>
                    <td>{row.trip?.internalRef ?? '—'}</td>
                    <td>{formatDate(row.trip?.runsheetDate)}</td>
                    <td>{row.status ? <PayoutStatusChip status={row.status} /> : '—'}</td>
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
