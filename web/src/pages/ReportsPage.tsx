import { useCallback, useEffect, useState, useId } from 'react';
import {
  fetchFinanceLookups,
  fetchArLedger,
  fetchApLedger,
  type ArLedgerResponse,
  type ApLedgerResponse,
  type ArLedgerRow,
  type ApLedgerRow,
} from '../api/client';
import { readSessionJson, writeSessionJson } from '../lib/sessionFilters';
import { BillingStatusChip, PayoutStatusChip } from '../components/StatusChip';

function formatDate(s: string | null | undefined) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString();
  } catch {
    return String(s);
  }
}

function formatAmount(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeCsv(s: string): string {
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildArCsv(rows: ArLedgerRow[]): string {
  const headers = ['Internal ref', 'Runsheet date', 'Client', 'Category', 'Billing status', 'Ledger date', 'Aging', 'Amount'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([
      escapeCsv(r.internalRef ?? ''),
      escapeCsv(r.runsheetDate ? new Date(r.runsheetDate).toLocaleDateString() : ''),
      escapeCsv(r.clientAccountName ?? ''),
      escapeCsv(r.serviceCategoryName ?? ''),
      escapeCsv(r.billingStatus ?? ''),
      escapeCsv(r.billingLedgerDate ? new Date(r.billingLedgerDate).toLocaleDateString() : ''),
      escapeCsv(r.agingBucket ?? ''),
      r.amount,
    ].join(','));
  }
  return lines.join('\r\n');
}

function buildApCsv(rows: ApLedgerRow[]): string {
  const headers = ['Internal ref', 'Runsheet date', 'Operator', 'Client', 'Category', 'Payout status', 'Due date', 'Aging', 'Amount'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([
      escapeCsv(r.internalRef ?? ''),
      escapeCsv(r.runsheetDate ? new Date(r.runsheetDate).toLocaleDateString() : ''),
      escapeCsv(r.operatorName ?? ''),
      escapeCsv(r.clientAccountName ?? ''),
      escapeCsv(r.serviceCategoryName ?? ''),
      escapeCsv(r.payoutStatus ?? ''),
      escapeCsv(r.payoutDueDate ? new Date(r.payoutDueDate).toLocaleDateString() : ''),
      escapeCsv(r.agingBucket ?? ''),
      r.amount,
    ].join(','));
  }
  return lines.join('\r\n');
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

type ReportTab = 'ar' | 'ap';

type ArFilters = { clientAccountId?: string; serviceCategoryId?: string; dateFrom?: string; dateTo?: string };
type ApFilters = { operatorId?: string; clientAccountId?: string; serviceCategoryId?: string; dateFrom?: string; dateTo?: string };

const PAGE_SIZE_OPTIONS = [50, 100, 200, 500];

type ReportsPageProps = { onSubChange?: (label: string | null) => void };

const REPORTS_KEY = 'ace.filters.reports.v1';

type ReportsPersist = {
  tab?: ReportTab;
  arApplied?: ArFilters;
  arPage?: number;
  arPageSize?: number;
  apApplied?: ApFilters;
  apPage?: number;
  apPageSize?: number;
};

export function ReportsPage({ onSubChange }: ReportsPageProps) {
  const arFid = useId();
  const apFid = useId();
  const [tab, setTab] = useState<ReportTab>(() => {
    const p = readSessionJson<ReportsPersist>(REPORTS_KEY);
    return p?.tab === 'ap' ? 'ap' : 'ar';
  });
  const [lookups, setLookups] = useState<{
    clients: Array<{ id: string; name: string; code: string; serviceCategories?: Array<{ id: string; name: string; code: string }> }>;
    operators: Array<{ id: string; name: string }>;
  } | null>(null);

  const [arFilters, setArFilters] = useState<ArFilters>(() => {
    const p = readSessionJson<ReportsPersist>(REPORTS_KEY);
    return { ...(p?.arApplied ?? {}) };
  });
  const [arApplied, setArApplied] = useState<ArFilters>(() => {
    const p = readSessionJson<ReportsPersist>(REPORTS_KEY);
    return { ...(p?.arApplied ?? {}) };
  });
  const [arPage, setArPage] = useState(() => readSessionJson<ReportsPersist>(REPORTS_KEY)?.arPage ?? 0);
  const [arPageSize, setArPageSize] = useState(() => {
    const n = readSessionJson<ReportsPersist>(REPORTS_KEY)?.arPageSize;
    return n && PAGE_SIZE_OPTIONS.includes(n) ? n : 100;
  });
  const [arData, setArData] = useState<ArLedgerResponse | null>(null);
  const [arLoading, setArLoading] = useState(true);
  const [arError, setArError] = useState<string | null>(null);
  const [arExporting, setArExporting] = useState(false);

  const [apFilters, setApFilters] = useState<ApFilters>(() => {
    const p = readSessionJson<ReportsPersist>(REPORTS_KEY);
    return { ...(p?.apApplied ?? {}) };
  });
  const [apApplied, setApApplied] = useState<ApFilters>(() => {
    const p = readSessionJson<ReportsPersist>(REPORTS_KEY);
    return { ...(p?.apApplied ?? {}) };
  });
  const [apPage, setApPage] = useState(() => readSessionJson<ReportsPersist>(REPORTS_KEY)?.apPage ?? 0);
  const [apPageSize, setApPageSize] = useState(() => {
    const n = readSessionJson<ReportsPersist>(REPORTS_KEY)?.apPageSize;
    return n && PAGE_SIZE_OPTIONS.includes(n) ? n : 100;
  });
  const [apData, setApData] = useState<ApLedgerResponse | null>(null);
  const [apLoading, setApLoading] = useState(true);
  const [apError, setApError] = useState<string | null>(null);
  const [apExporting, setApExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchFinanceLookups()
      .then((res) => { if (!cancelled) setLookups(res); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    writeSessionJson(REPORTS_KEY, {
      tab,
      arApplied,
      arPage,
      arPageSize,
      apApplied,
      apPage,
      apPageSize,
    });
  }, [tab, arApplied, arPage, arPageSize, apApplied, apPage, apPageSize]);

  const loadArLedger = useCallback((params: ArFilters & { limit?: number; offset?: number }) => {
    setArLoading(true);
    setArError(null);
    fetchArLedger(params)
      .then(setArData)
      .catch((e) => setArError(e instanceof Error ? e.message : 'Failed to load AR ledger'))
      .finally(() => setArLoading(false));
  }, []);

  const loadApLedger = useCallback((params: ApFilters & { limit?: number; offset?: number }) => {
    setApLoading(true);
    setApError(null);
    fetchApLedger(params)
      .then(setApData)
      .catch((e) => setApError(e instanceof Error ? e.message : 'Failed to load AP ledger'))
      .finally(() => setApLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'ar') loadArLedger({ ...arApplied, limit: arPageSize, offset: arPage * arPageSize });
  }, [tab, arApplied, arPage, arPageSize, loadArLedger]);

  useEffect(() => {
    if (tab === 'ap') loadApLedger({ ...apApplied, limit: apPageSize, offset: apPage * apPageSize });
  }, [tab, apApplied, apPage, apPageSize, loadApLedger]);

  useEffect(() => {
    onSubChange?.(tab === 'ar' ? 'AR Ledger' : 'AP Ledger');
  }, [tab, onSubChange]);

  const allCategories = lookups?.clients?.flatMap((c) => c.serviceCategories ?? []) ?? [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">AR ledger (receivables from clients) and AP ledger (payables to operators) with aging.</p>
      </div>

      <div className="sub-nav">
        <button
          type="button"
          className={`sub-nav-btn ${tab === 'ar' ? 'active' : ''}`}
          onClick={() => setTab('ar')}
        >
          AR Ledger
        </button>
        <button
          type="button"
          className={`sub-nav-btn ${tab === 'ap' ? 'active' : ''}`}
          onClick={() => setTab('ap')}
        >
          AP Ledger
        </button>
      </div>

      {tab === 'ar' && (
        <>
          <section className="panel">
            <h3 className="panel-title">Filters</h3>
            <p className="page-subtitle page-subtitle--spaced">
              Scope the ledger by client, category, and runsheet dates, then Apply. Clear all resets every filter.
            </p>
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${arFid}-client`}>Client</label>
                <select
                  id={`${arFid}-client`}
                  className="filter-select"
                  value={arFilters.clientAccountId ?? ''}
                  onChange={(e) => setArFilters((f) => ({ ...f, clientAccountId: e.target.value || undefined, serviceCategoryId: undefined }))}
                >
                  <option value="">All</option>
                  {lookups?.clients?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${arFid}-category`}>Service category</label>
                <select
                  id={`${arFid}-category`}
                  className="filter-select"
                  value={arFilters.serviceCategoryId ?? ''}
                  onChange={(e) => setArFilters((f) => ({ ...f, serviceCategoryId: e.target.value || undefined }))}
                  style={{ minWidth: 180 }}
                >
                  <option value="">All</option>
                  {allCategories.map((sc) => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${arFid}-date-from`}>Date from</label>
                <input
                  id={`${arFid}-date-from`}
                  type="date"
                  className="filter-input"
                  value={arFilters.dateFrom ?? ''}
                  onChange={(e) => setArFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
                />
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${arFid}-date-to`}>Date to</label>
                <input
                  id={`${arFid}-date-to`}
                  type="date"
                  className="filter-input"
                  value={arFilters.dateTo ?? ''}
                  onChange={(e) => setArFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
                />
              </div>
              <div className="filters-actions">
                <button type="button" className="btn btn-primary" onClick={() => { setArApplied({ ...arFilters }); setArPage(0); }}>Apply</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setArFilters({}); setArApplied({}); setArPage(0); }}>Clear all</button>
              </div>
            </div>
          </section>

          {!arData && (
            <section className="panel">
              <h3 className="panel-title">AR Ledger (Receivables)</h3>
              <p className="page-subtitle page-subtitle--spaced">
                Trips with billing status Ready to bill or Billed. Use filters above, then Apply.
              </p>
              {arError && <div className="error-msg">{arError}</div>}
              {arLoading && (
                <p className="loading-msg loading-msg--with-spinner" role="status">
                  <span className="loading-spinner" aria-hidden />
                  Loading AR ledger…
                </p>
              )}
            </section>
          )}

          {arData && (
            <>
              <section className="panel">
                <h3 className="panel-title">AR — Summary (this page)</h3>
                <p className="page-subtitle page-subtitle--spaced">
                  Totals and aging buckets for the rows on the current page.
                </p>
                {arError && <div className="error-msg">{arError}</div>}
                {arLoading && (
                  <p className="updating-msg updating-msg--spaced loading-msg--with-spinner" role="status">
                    <span className="loading-spinner" aria-hidden />
                    Updating…
                  </p>
                )}
                <div className="kpi-section kpi-section--flat">
                  <div className="kpi-group-title">Total receivable (this page)</div>
                  <div className="kpi-tile kpi-tile--compact">
                    <div className="kpi-value">{formatAmount(arData.totalReceivable)}</div>
                    <div className="kpi-label">PHP</div>
                  </div>
                </div>
                <h4 className="subsection-heading">Aging summary (this page)</h4>
                <div className="table-wrap table-wrap--narrow">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Bucket (days)</th>
                        <th className="table-cell-num">Count</th>
                        <th className="table-cell-num">Amount (PHP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arData.aging.map((row) => (
                        <tr key={row.bucket}>
                          <td>{row.bucket}</td>
                          <td className="table-cell-num">{row.count}</td>
                          <td className="table-cell-num">{formatAmount(row.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="panel">
                <h3 className="panel-title">AR — Ledger</h3>
                <p className="page-subtitle page-subtitle--spaced">
                  Paginated rows. Export CSV pulls up to 2000 matching records.
                </p>
                <div className="ledger-toolbar">
                  <span className="text-muted">
                    Showing {arData.ledger.length === 0 ? 0 : arPage * arPageSize + 1}–{arPage * arPageSize + arData.ledger.length} of {arData.totalCount ?? arData.ledger.length}
                  </span>
                  <select
                    className="filter-select"
                    value={arPageSize}
                    onChange={(e) => { setArPageSize(Number(e.target.value)); setArPage(0); }}
                    style={{ width: 80 }}
                    aria-label="AR ledger rows per page"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (<option key={n} value={n}>{n}</option>))}
                  </select>
                  <span className="text-muted">per page</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={arPage === 0}
                    onClick={() => setArPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={(arPage + 1) * arPageSize >= (arData.totalCount ?? 0)}
                    onClick={() => setArPage((p) => p + 1)}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={arExporting || (arData.totalCount ?? 0) === 0}
                    onClick={async () => {
                      setArExporting(true);
                      try {
                        const all: ArLedgerRow[] = [];
                        let offset = 0;
                        const limit = 500;
                        while (true) {
                          const res = await fetchArLedger({ ...arApplied, limit, offset });
                          all.push(...res.ledger);
                          if (res.ledger.length < limit || all.length >= (res.totalCount ?? 0)) break;
                          offset += limit;
                          if (all.length >= 2000) break;
                        }
                        downloadCsv(`ar-ledger-${new Date().toISOString().slice(0, 10)}.csv`, buildArCsv(all));
                      } finally {
                        setArExporting(false);
                      }
                    }}
                  >
                    {arExporting ? 'Exporting…' : 'Export CSV'}
                  </button>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Internal ref</th>
                        <th>Runsheet date</th>
                        <th>Client</th>
                        <th>Category</th>
                        <th>Billing status</th>
                        <th>Ledger date</th>
                        <th>Aging</th>
                        <th className="table-cell-num">Amount (PHP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arData.ledger.length === 0 ? (
                        <tr><td colSpan={8} className="table-empty">No records</td></tr>
                      ) : (
                        arData.ledger.map((row) => (
                          <tr key={row.tripFinanceId}>
                            <td>{row.internalRef}</td>
                            <td>{formatDate(row.runsheetDate)}</td>
                            <td>{row.clientAccountName ?? '—'}</td>
                            <td>{row.serviceCategoryName ?? '—'}</td>
                            <td><BillingStatusChip status={row.billingStatus} /></td>
                            <td>{formatDate(row.billingLedgerDate)}</td>
                            <td>{row.agingBucket}</td>
                            <td className="table-cell-num">{formatAmount(row.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}

      {tab === 'ap' && (
        <>
          <section className="panel">
            <h3 className="panel-title">Filters</h3>
            <p className="page-subtitle page-subtitle--spaced">
              Scope payables by operator, client, category, and due dates, then Apply.
            </p>
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${apFid}-operator`}>Operator</label>
                <select
                  id={`${apFid}-operator`}
                  className="filter-select"
                  value={apFilters.operatorId ?? ''}
                  onChange={(e) => setApFilters((f) => ({ ...f, operatorId: e.target.value || undefined }))}
                >
                  <option value="">All</option>
                  {lookups?.operators?.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${apFid}-client`}>Client</label>
                <select
                  id={`${apFid}-client`}
                  className="filter-select"
                  value={apFilters.clientAccountId ?? ''}
                  onChange={(e) => setApFilters((f) => ({ ...f, clientAccountId: e.target.value || undefined }))}
                >
                  <option value="">All</option>
                  {lookups?.clients?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${apFid}-category`}>Service category</label>
                <select
                  id={`${apFid}-category`}
                  className="filter-select"
                  value={apFilters.serviceCategoryId ?? ''}
                  onChange={(e) => setApFilters((f) => ({ ...f, serviceCategoryId: e.target.value || undefined }))}
                  style={{ minWidth: 180 }}
                >
                  <option value="">All</option>
                  {allCategories.map((sc) => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${apFid}-date-from`}>Date from</label>
                <input
                  id={`${apFid}-date-from`}
                  type="date"
                  className="filter-input"
                  value={apFilters.dateFrom ?? ''}
                  onChange={(e) => setApFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
                />
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor={`${apFid}-date-to`}>Date to</label>
                <input
                  id={`${apFid}-date-to`}
                  type="date"
                  className="filter-input"
                  value={apFilters.dateTo ?? ''}
                  onChange={(e) => setApFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
                />
              </div>
              <div className="filters-actions">
                <button type="button" className="btn btn-primary" onClick={() => { setApApplied({ ...apFilters }); setApPage(0); }}>Apply</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setApFilters({}); setApApplied({}); setApPage(0); }}>Clear all</button>
              </div>
            </div>
          </section>

          {!apData && (
            <section className="panel">
              <h3 className="panel-title">AP Ledger (Payables)</h3>
              <p className="page-subtitle page-subtitle--spaced">
                Trips with payout status not Paid. Use filters above, then Apply.
              </p>
              {apError && <div className="error-msg">{apError}</div>}
              {apLoading && (
                <p className="loading-msg loading-msg--with-spinner" role="status">
                  <span className="loading-spinner" aria-hidden />
                  Loading AP ledger…
                </p>
              )}
            </section>
          )}

          {apData && (
            <>
              <section className="panel">
                <h3 className="panel-title">AP — Summary (this page)</h3>
                <p className="page-subtitle page-subtitle--spaced">
                  Totals and aging buckets for the rows on the current page.
                </p>
                {apError && <div className="error-msg">{apError}</div>}
                {apLoading && (
                  <p className="updating-msg updating-msg--spaced loading-msg--with-spinner" role="status">
                    <span className="loading-spinner" aria-hidden />
                    Updating…
                  </p>
                )}
                <div className="kpi-section kpi-section--flat">
                  <div className="kpi-group-title">Total payable (this page)</div>
                  <div className="kpi-tile kpi-tile--compact">
                    <div className="kpi-value">{formatAmount(apData.totalPayable)}</div>
                    <div className="kpi-label">PHP</div>
                  </div>
                </div>
                <h4 className="subsection-heading">Aging summary (this page)</h4>
                <div className="table-wrap table-wrap--narrow">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Bucket (days)</th>
                        <th className="table-cell-num">Count</th>
                        <th className="table-cell-num">Amount (PHP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apData.aging.map((row) => (
                        <tr key={row.bucket}>
                          <td>{row.bucket}</td>
                          <td className="table-cell-num">{row.count}</td>
                          <td className="table-cell-num">{formatAmount(row.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="panel">
                <h3 className="panel-title">AP — Ledger</h3>
                <p className="page-subtitle page-subtitle--spaced">
                  Paginated rows. Export CSV pulls up to 2000 matching records.
                </p>
                <div className="ledger-toolbar">
                  <span className="text-muted">
                    Showing {apData.ledger.length === 0 ? 0 : apPage * apPageSize + 1}–{apPage * apPageSize + apData.ledger.length} of {apData.totalCount ?? apData.ledger.length}
                  </span>
                  <select
                    className="filter-select"
                    value={apPageSize}
                    onChange={(e) => { setApPageSize(Number(e.target.value)); setApPage(0); }}
                    style={{ width: 80 }}
                    aria-label="AP ledger rows per page"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (<option key={n} value={n}>{n}</option>))}
                  </select>
                  <span className="text-muted">per page</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={apPage === 0}
                    onClick={() => setApPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={(apPage + 1) * apPageSize >= (apData.totalCount ?? 0)}
                    onClick={() => setApPage((p) => p + 1)}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={apExporting || (apData.totalCount ?? 0) === 0}
                    onClick={async () => {
                      setApExporting(true);
                      try {
                        const all: ApLedgerRow[] = [];
                        let offset = 0;
                        const limit = 500;
                        while (true) {
                          const res = await fetchApLedger({ ...apApplied, limit, offset });
                          all.push(...res.ledger);
                          if (res.ledger.length < limit || all.length >= (res.totalCount ?? 0)) break;
                          offset += limit;
                          if (all.length >= 2000) break;
                        }
                        downloadCsv(`ap-ledger-${new Date().toISOString().slice(0, 10)}.csv`, buildApCsv(all));
                      } finally {
                        setApExporting(false);
                      }
                    }}
                  >
                    {apExporting ? 'Exporting…' : 'Export CSV'}
                  </button>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Internal ref</th>
                        <th>Runsheet date</th>
                        <th>Operator</th>
                        <th>Client</th>
                        <th>Category</th>
                        <th>Payout status</th>
                        <th>Due date</th>
                        <th>Aging</th>
                        <th className="table-cell-num">Amount (PHP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apData.ledger.length === 0 ? (
                        <tr><td colSpan={9} className="table-empty">No records</td></tr>
                      ) : (
                        apData.ledger.map((row) => (
                          <tr key={row.tripFinanceId}>
                            <td>{row.internalRef}</td>
                            <td>{formatDate(row.runsheetDate)}</td>
                            <td>{row.operatorName ?? '—'}</td>
                            <td>{row.clientAccountName ?? '—'}</td>
                            <td>{row.serviceCategoryName ?? '—'}</td>
                            <td><PayoutStatusChip status={row.payoutStatus} /></td>
                            <td>{formatDate(row.payoutDueDate)}</td>
                            <td>{row.agingBucket}</td>
                            <td className="table-cell-num">{formatAmount(row.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
