import { useCallback, useEffect, useState, useId } from 'react';
import {
  getArBatches,
  getArBatchById,
  attachInvoiceToArBatch,
  markArBatchDeposited,
  importReverseBillingCsv,
  importPaymentListCsv,
  fetchFinanceLookups,
  type ArBatchListItem,
  type ArBatchDetail,
  type ReverseBillingImportResult,
  type PaymentListImportResult,
} from '../api/client';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ArBatchStatusChip } from '../components/StatusChip';
import { TableEmptyState } from '../components/TableEmptyState';
import { readSessionJson, writeSessionJson, clearSessionKey } from '../lib/sessionFilters';

const SERVICE_SEGMENTS = [
  { value: 'FM_ONCALL', label: 'FM Oncall' },
  { value: 'FM_WETLEASE', label: 'FM Wetlease' },
  { value: 'MFM_ONCALL', label: 'MFM Oncall' },
];

const BATCH_STATUSES = [
  'REVERSE_BILLING_RECEIVED',
  'INVOICED',
  'PAYMENT_LIST_RECEIVED',
  'DEPOSITED',
];

function formatDate(s: string | null | undefined) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString();
  } catch {
    return String(s);
  }
}

function formatAmount(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'number') return v.toLocaleString('en-PH', { minimumFractionDigits: 2 });
  if (typeof v === 'object' && v !== null && 'toNumber' in v && typeof (v as { toNumber: () => number }).toNumber === 'function') {
    return ((v as { toNumber: () => number }).toNumber()).toLocaleString('en-PH', { minimumFractionDigits: 2 });
  }
  return String(v);
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

const REVERSE_BILLING_CSV = `client_trip_ref,our_internal_ref,service_category_code,runsheet_date,amount_client
REF-001,SPX-2026-0001,SPX_FM_4W_ONCALL,2026-02-05,1200.00
REF-002,,SPX_FM_6WCV_ONCALL,2026-02-10,`;

const PAYMENT_LIST_CSV = `invoice_number,amount_paid
INV-2026-02-FM-001,150000.00
INV-2026-02-FM-002,98000.50`;

type ListFilters = {
  clientAccountId?: string;
  serviceSegment?: string;
  status?: string;
  cutoffFrom?: string;
  cutoffTo?: string;
};

const AR_BATCH_FILTERS_KEY = 'ace.filters.arBatches.v1';

export function ArBatchesPage() {
  const listFid = useId();
  const toast = useToast();
  const [batches, setBatches] = useState<ArBatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lookups, setLookups] = useState<{
    clients: Array<{ id: string; name: string; code: string }>;
  } | null>(null);
  const [filters, setFilters] = useState<ListFilters>(() => {
    const p = readSessionJson<{ applied?: ListFilters; filters?: ListFilters }>(AR_BATCH_FILTERS_KEY);
    const a = p?.applied ?? p?.filters;
    return a ? { ...a } : {};
  });
  const [applied, setApplied] = useState<ListFilters>(() => {
    const p = readSessionJson<{ applied?: ListFilters; filters?: ListFilters }>(AR_BATCH_FILTERS_KEY);
    const a = p?.applied ?? p?.filters;
    return a ? { ...a } : {};
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ArBatchDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');

  // Reverse billing import
  const [rbFile, setRbFile] = useState<File | null>(null);
  const [rbClientCode, setRbClientCode] = useState('');
  const [rbSegment, setRbSegment] = useState('FM_ONCALL');
  const [rbCutoffStart, setRbCutoffStart] = useState('');
  const [rbCutoffEnd, setRbCutoffEnd] = useState('');
  const [rbLoading, setRbLoading] = useState(false);
  const [rbResult, setRbResult] = useState<ReverseBillingImportResult | null>(null);
  const [rbPreviewRun, setRbPreviewRun] = useState(false);

  // Payment list import
  const [plFile, setPlFile] = useState<File | null>(null);
  const [plClientCode, setPlClientCode] = useState('');
  const [plReceivedDate, setPlReceivedDate] = useState('');
  const [plLoading, setPlLoading] = useState(false);
  const [plResult, setPlResult] = useState<PaymentListImportResult | null>(null);
  const [plPreviewRun, setPlPreviewRun] = useState(false);
  const [rbCommitOpen, setRbCommitOpen] = useState(false);
  const [plCommitOpen, setPlCommitOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchFinanceLookups()
      .then((res) => { if (!cancelled) setLookups(res); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const loadBatches = useCallback((params: ListFilters) => {
    setLoading(true);
    setError(null);
    const q: Record<string, string> = {};
    if (params.clientAccountId) q.clientAccountId = params.clientAccountId;
    if (params.serviceSegment) q.serviceSegment = params.serviceSegment;
    if (params.status) q.status = params.status;
    if (params.cutoffFrom) q.cutoffFrom = params.cutoffFrom;
    if (params.cutoffTo) q.cutoffTo = params.cutoffTo;
    getArBatches(q)
      .then(setBatches)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load batches'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadBatches(applied);
  }, [applied, loadBatches]);

  useEffect(() => {
    writeSessionJson(AR_BATCH_FILTERS_KEY, { applied });
  }, [applied]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    getArBatchById(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const onApply = () => setApplied({ ...filters });
  const onReset = () => {
    setFilters({});
    setApplied({});
    clearSessionKey(AR_BATCH_FILTERS_KEY);
  };

  const handleAttachInvoice = async () => {
    if (!selectedId || !invoiceNumber.trim() || !invoiceDate) return;
    setActionLoading(true);
    try {
      const updated = await attachInvoiceToArBatch(selectedId, {
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
      });
      setDetail(updated);
      setInvoiceNumber('');
      setInvoiceDate('');
      loadBatches(applied);
      toast.show('Invoice attached.', { variant: 'success' });
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Attach invoice failed', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const runMarkDeposited = async () => {
    setDepositOpen(false);
    if (!selectedId) return;
    setActionLoading(true);
    try {
      const updated = await markArBatchDeposited(selectedId);
      setDetail(updated);
      loadBatches(applied);
      toast.show('Batch marked as deposited.', { variant: 'success' });
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Mark deposited failed', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReverseBillingPreview = async () => {
    if (!rbFile || !rbClientCode || !rbSegment || !rbCutoffStart || !rbCutoffEnd) {
      toast.show('Please select file, client, segment, and cutoff dates.', { variant: 'error' });
      return;
    }
    setRbLoading(true);
    setRbResult(null);
    try {
      const result = await importReverseBillingCsv(rbFile, {
        commit: false,
        client_code: rbClientCode,
        service_segment: rbSegment,
        cutoff_start_date: rbCutoffStart,
        cutoff_end_date: rbCutoffEnd,
      });
      setRbResult(result);
      setRbPreviewRun(true);
    } catch (e) {
      setRbResult({ mode: 'preview', errors: [{ message: e instanceof Error ? e.message : 'Import failed' }] });
      setRbPreviewRun(true);
    } finally {
      setRbLoading(false);
    }
  };

  const requestReverseBillingCommit = () => {
    if (!rbFile || !rbClientCode || !rbSegment || !rbCutoffStart || !rbCutoffEnd) {
      toast.show('Please select file, client, segment, and cutoff dates.', { variant: 'error' });
      return;
    }
    setRbCommitOpen(true);
  };

  const runReverseBillingCommit = async () => {
    setRbCommitOpen(false);
    if (!rbFile || !rbClientCode || !rbSegment || !rbCutoffStart || !rbCutoffEnd) return;
    setRbLoading(true);
    setRbResult(null);
    try {
      const result = await importReverseBillingCsv(rbFile, {
        commit: true,
        client_code: rbClientCode,
        service_segment: rbSegment,
        cutoff_start_date: rbCutoffStart,
        cutoff_end_date: rbCutoffEnd,
      });
      setRbResult(result);
      loadBatches(applied);
      if (selectedId) getArBatchById(selectedId).then(setDetail).catch(() => {});
      toast.show('Reverse billing imported.', { variant: 'success' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Import failed';
      setRbResult({ mode: 'commit', errors: [{ message: msg }] });
      toast.show(msg, { variant: 'error' });
    } finally {
      setRbLoading(false);
    }
  };

  const handlePaymentListPreview = async () => {
    if (!plFile || !plClientCode || !plReceivedDate) {
      toast.show('Please select file, client, and payment list received date.', { variant: 'error' });
      return;
    }
    setPlLoading(true);
    setPlResult(null);
    try {
      const result = await importPaymentListCsv(plFile, {
        commit: false,
        client_code: plClientCode,
        payment_list_received_date: plReceivedDate,
      });
      setPlResult(result);
      setPlPreviewRun(true);
    } catch (e) {
      setPlResult({ mode: 'preview', errors: [{ message: e instanceof Error ? e.message : 'Import failed' }] });
      setPlPreviewRun(true);
    } finally {
      setPlLoading(false);
    }
  };

  const requestPaymentListCommit = () => {
    if (!plFile || !plClientCode || !plReceivedDate) {
      toast.show('Please select file, client, and payment list received date.', { variant: 'error' });
      return;
    }
    setPlCommitOpen(true);
  };

  const runPaymentListCommit = async () => {
    setPlCommitOpen(false);
    if (!plFile || !plClientCode || !plReceivedDate) return;
    setPlLoading(true);
    setPlResult(null);
    try {
      const result = await importPaymentListCsv(plFile, {
        commit: true,
        client_code: plClientCode,
        payment_list_received_date: plReceivedDate,
      });
      setPlResult(result);
      loadBatches(applied);
      if (selectedId) getArBatchById(selectedId).then(setDetail).catch(() => {});
      toast.show('Payment list imported.', { variant: 'success' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Import failed';
      setPlResult({ mode: 'commit', errors: [{ message: msg }] });
      toast.show(msg, { variant: 'error' });
    } finally {
      setPlLoading(false);
    }
  };

  const selectedBatch = batches.find((b) => b.id === selectedId);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">AR Batches</h1>
        <p className="page-subtitle">Client receivables: reverse billing, invoice, payment list, deposit.</p>
      </div>

      <section className="panel">
        <h3 className="panel-title">Filters</h3>
        <p className="page-subtitle page-subtitle--spaced">
          Scope batches by client, segment, status, and cutoff dates, then Apply. Clear all resets every filter.
        </p>
        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${listFid}-client`}>Client</label>
            <select
              id={`${listFid}-client`}
              className="filter-select"
              value={filters.clientAccountId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, clientAccountId: e.target.value || undefined }))}
            >
              <option value="">All</option>
              {lookups?.clients?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${listFid}-segment`}>Segment</label>
            <select
              id={`${listFid}-segment`}
              className="filter-select"
              value={filters.serviceSegment ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, serviceSegment: e.target.value || undefined }))}
            >
              <option value="">All</option>
              {SERVICE_SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${listFid}-status`}>Status</label>
            <select
              id={`${listFid}-status`}
              className="filter-select"
              value={filters.status ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
            >
              <option value="">All</option>
              {BATCH_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${listFid}-cutoff-from`}>Cutoff from</label>
            <input
              id={`${listFid}-cutoff-from`}
              type="date"
              className="filter-input"
              value={filters.cutoffFrom ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, cutoffFrom: e.target.value || undefined }))}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${listFid}-cutoff-to`}>Cutoff to</label>
            <input
              id={`${listFid}-cutoff-to`}
              type="date"
              className="filter-input"
              value={filters.cutoffTo ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, cutoffTo: e.target.value || undefined }))}
            />
          </div>
          <div className="filters-actions">
            <button type="button" onClick={onApply} className="btn btn-primary">Apply</button>
            <button type="button" onClick={onReset} className="btn btn-secondary">Clear all</button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">Batches</h3>
        <p className="page-subtitle page-subtitle--spaced">
          Select a row to view trips and take actions. Adjust filters above, then Apply.
        </p>
        {error && <div className="error-msg">{error}</div>}
        {loading && !batches.length && (
          <p className="loading-msg loading-msg--with-spinner" role="status">
            <span className="loading-spinner" aria-hidden />
            Loading batches…
          </p>
        )}
        {!loading && !error && batches.length === 0 ? (
          <TableEmptyState
            message="No AR batches match your filters."
            hint="Try a wider cutoff range or different status. New batches often come from reverse billing import below."
          />
        ) : batches.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Segment</th>
                  <th>Cutoff start</th>
                  <th>Cutoff end</th>
                  <th>Status</th>
                  <th className="table-cell-num">Trips</th>
                  <th className="table-cell-num">Unmatched</th>
                  <th>Invoice #</th>
                  <th>Invoice date</th>
                  <th>Deposited</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr
                    key={b.id}
                    className={`table-row--interactive${selectedId === b.id ? ' selected' : ''}`}
                    tabIndex={0}
                    onClick={() => setSelectedId(b.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(b.id);
                      }
                    }}
                  >
                    <td>{b.clientAccount?.name ?? b.clientAccountId}</td>
                    <td>{b.serviceSegment}</td>
                    <td>{formatDate(b.cutoffStartDate)}</td>
                    <td>{formatDate(b.cutoffEndDate)}</td>
                    <td><ArBatchStatusChip status={b.status} /></td>
                    <td>{b._count?.trips ?? 0}</td>
                    <td>{b._count?.unmatchedLines ?? 0}</td>
                    <td>{b.invoiceNumber ?? '—'}</td>
                    <td>{formatDate(b.invoiceDate)}</td>
                    <td>{formatDate(b.depositedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {selectedId && (
        <section className="panel">
          <h3 className="panel-title">Batch detail {selectedBatch ? `— ${selectedBatch.clientAccount?.name} ${selectedBatch.serviceSegment}` : ''}</h3>
          {detailLoading && (
            <p className="loading-msg loading-msg--with-spinner" role="status">
              <span className="loading-spinner" aria-hidden />
              Loading batch…
            </p>
          )}
          {!detailLoading && detail && (
            <>
              <div className="form-block batch-detail-row">
                <div><strong>Status:</strong> <ArBatchStatusChip status={detail.status} /></div>
                <div>Reverse billing received: {formatDate(detail.reverseBillingReceivedAt)}</div>
                {detail.invoiceNumber && <div>Invoice: {detail.invoiceNumber} ({formatDate(detail.invoiceDate)})</div>}
                {detail.paymentListReceivedAt && <div>Payment list: {formatDate(detail.paymentListReceivedAt)}</div>}
                {detail.checkPickupDate && <div>Check pickup: {formatDate(detail.checkPickupDate)}</div>}
                {detail.depositedAt && <div>Deposited: {formatDate(detail.depositedAt)}</div>}
              </div>

              {detail.status === 'REVERSE_BILLING_RECEIVED' && (
                <div className="attach-invoice-card">
                  <h4 className="subsection-heading">Attach invoice</h4>
                  <div className="attach-invoice-fields">
                    <div className="filter-group">
                      <span className="filter-label">Invoice number</span>
                      <input
                        type="text"
                        className="filter-input"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="e.g. INV-2026-001"
                        style={{ minWidth: 160 }}
                      />
                    </div>
                    <div className="filter-group">
                      <span className="filter-label">Invoice date</span>
                      <input
                        type="date"
                        className="filter-input"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                      />
                    </div>
                    <button type="button" className="btn btn-primary" onClick={handleAttachInvoice} disabled={actionLoading || !invoiceNumber.trim() || !invoiceDate}>
                      {actionLoading ? 'Saving…' : 'Attach invoice'}
                    </button>
                  </div>
                </div>
              )}

              {detail.status === 'PAYMENT_LIST_RECEIVED' && (
                <div className="detail-toolbar">
                  <button type="button" className="btn btn-primary" onClick={() => setDepositOpen(true)} disabled={actionLoading}>
                    {actionLoading ? 'Saving…' : 'Mark as deposited'}
                  </button>
                </div>
              )}

              <h4 className="subsection-heading">Trips in batch ({detail.trips?.length ?? 0})</h4>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Internal ref</th>
                      <th>Client ref</th>
                      <th>Runsheet date</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!detail.trips || detail.trips.length === 0) ? (
                      <tr>
                        <td colSpan={4} style={{ padding: 0, border: 'none' }}>
                          <TableEmptyState message="No trips linked to this batch yet." />
                        </td>
                      </tr>
                    ) : (
                      detail.trips.map(({ trip }) => (
                        <tr key={trip.id}>
                          <td>{trip.internalRef}</td>
                          <td>{trip.clientTripRef ?? trip.externalRef ?? '—'}</td>
                          <td>{formatDate(trip.runsheetDate)}</td>
                          <td>{trip.serviceCategory?.name ?? trip.serviceCategory?.code ?? '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <h4 className="subsection-heading">Client-listed, no record ({detail.unmatchedLines?.length ?? 0})</h4>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Client ref</th>
                      <th>Our ref</th>
                      <th>Category</th>
                      <th>Runsheet date</th>
                      <th>Amount (client)</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!detail.unmatchedLines || detail.unmatchedLines.length === 0) ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 0, border: 'none' }}>
                          <TableEmptyState message="No unmatched client lines for this batch." hint="Lines appear when the client list includes refs we could not match to trips." />
                        </td>
                      </tr>
                    ) : (
                      detail.unmatchedLines.map((u) => (
                        <tr key={u.id}>
                          <td>{u.clientProvidedRef}</td>
                          <td>{u.ourInternalRef ?? '—'}</td>
                          <td>{u.serviceCategoryCode ?? '—'}</td>
                          <td>{formatDate(u.runsheetDate)}</td>
                          <td className="table-cell-num">{formatAmount(u.amountClient)}</td>
                          <td>{u.notes ?? '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      <section className="panel">
        <div className="panel-header-inline">
          <h3 className="panel-title">Reverse billing — import</h3>
          <a
            href="#"
            className="template-download-link"
            onClick={(e) => { e.preventDefault(); downloadCsv('reverse_billing_template.csv', REVERSE_BILLING_CSV); }}
          >
            Download template (CSV)
          </a>
        </div>
        <p className="page-subtitle page-subtitle--spaced">
          Columns: client_trip_ref (required), our_internal_ref, service_category_code, runsheet_date, amount_client. Run Preview first; Commit is only enabled after a preview.
        </p>
        <div className="form-grid form-grid--import-wide">
          <div className="filter-group">
            <span className="filter-label">Client code</span>
            <select
              className="filter-select"
              value={rbClientCode}
              onChange={(e) => { setRbClientCode(e.target.value); setRbPreviewRun(false); }}
              style={{ width: '100%' }}
            >
              <option value="">Select</option>
              {lookups?.clients?.map((c) => (
                <option key={c.id} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Segment</span>
            <select className="filter-select" value={rbSegment} onChange={(e) => { setRbSegment(e.target.value); setRbPreviewRun(false); }} style={{ width: '100%' }}>
              {SERVICE_SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Cutoff start</span>
            <input type="date" className="filter-input" value={rbCutoffStart} onChange={(e) => { setRbCutoffStart(e.target.value); setRbPreviewRun(false); }} style={{ width: '100%' }} />
          </div>
          <div className="filter-group">
            <span className="filter-label">Cutoff end</span>
            <input type="date" className="filter-input" value={rbCutoffEnd} onChange={(e) => { setRbCutoffEnd(e.target.value); setRbPreviewRun(false); }} style={{ width: '100%' }} />
          </div>
          <div className="filter-group span-2">
            <span className="filter-label">CSV file</span>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => { setRbFile(e.target.files?.[0] ?? null); setRbPreviewRun(false); }}
              className="input-file-block"
            />
            {rbFile && <span className="text-muted">{rbFile.name}</span>}
          </div>
        </div>
        <div className="form-actions-row">
          <button type="button" className="btn btn-secondary" onClick={handleReverseBillingPreview} disabled={rbLoading || !rbFile || !rbClientCode || !rbCutoffStart || !rbCutoffEnd}>
            {rbLoading ? '…' : 'Preview'}
          </button>
          <button type="button" className="btn btn-primary" onClick={requestReverseBillingCommit} disabled={rbLoading || !rbPreviewRun} title={!rbPreviewRun ? 'Run Preview first to enable Commit' : undefined}>
            {rbLoading ? '…' : 'Commit'}
          </button>
          {!rbPreviewRun && <span className="text-muted">Run Preview first to enable Commit.</span>}
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">Reverse billing — preview & result</h3>
        <p className="page-subtitle page-subtitle--spaced">
          Match counts and errors appear here after Preview or Commit.
        </p>
        {rbResult ? (
          <div className="import-result-box">
            <strong>Result ({rbResult.mode}):</strong>
            {rbResult.errors?.length ? (
              <ul>{rbResult.errors.map((err, i) => <li key={i}>{err.message}</li>)}</ul>
            ) : (
              <ul>
                {rbResult.matched != null && <li>Matched: {rbResult.matched}</li>}
                {rbResult.disputes != null && <li>Disputes (our trips not in client list): {rbResult.disputes}</li>}
                {rbResult.unmatched != null && <li>Unmatched (client-listed, no record): {rbResult.unmatched}</li>}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-muted">Run Preview to see validation results here.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-header-inline">
          <h3 className="panel-title">Payment list — import</h3>
          <a
            href="#"
            className="template-download-link"
            onClick={(e) => { e.preventDefault(); downloadCsv('payment_list_template.csv', PAYMENT_LIST_CSV); }}
          >
            Download template (CSV)
          </a>
        </div>
        <p className="page-subtitle page-subtitle--spaced">
          Columns: invoice_number (required), amount_paid. Run Preview first; Commit is only enabled after a preview.
        </p>
        <div className="form-grid form-grid--import-wide">
          <div className="filter-group">
            <span className="filter-label">Client code</span>
            <select
              className="filter-select"
              value={plClientCode}
              onChange={(e) => { setPlClientCode(e.target.value); setPlPreviewRun(false); }}
              style={{ width: '100%' }}
            >
              <option value="">Select</option>
              {lookups?.clients?.map((c) => (
                <option key={c.id} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Payment list received date</span>
            <input type="date" className="filter-input" value={plReceivedDate} onChange={(e) => { setPlReceivedDate(e.target.value); setPlPreviewRun(false); }} style={{ width: '100%' }} />
          </div>
          <div className="filter-group">
            <span className="filter-label">CSV file</span>
            <input type="file" accept=".csv" onChange={(e) => { setPlFile(e.target.files?.[0] ?? null); setPlPreviewRun(false); }} className="input-file-block" />
            {plFile && <span className="text-muted">{plFile.name}</span>}
          </div>
        </div>
        <div className="form-actions-row">
          <button type="button" className="btn btn-secondary" onClick={handlePaymentListPreview} disabled={plLoading || !plFile || !plClientCode || !plReceivedDate}>
            {plLoading ? '…' : 'Preview'}
          </button>
          <button type="button" className="btn btn-primary" onClick={requestPaymentListCommit} disabled={plLoading || !plPreviewRun} title={!plPreviewRun ? 'Run Preview first to enable Commit' : undefined}>
            {plLoading ? '…' : 'Commit'}
          </button>
          {!plPreviewRun && <span className="text-muted">Run Preview first to enable Commit.</span>}
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">Payment list — preview & result</h3>
        <p className="page-subtitle page-subtitle--spaced">
          Update counts and not-found invoices appear here after Preview or Commit.
        </p>
        {plResult ? (
          <div className="import-result-box">
            <strong>Result ({plResult.mode}):</strong>
            {plResult.errors?.length ? (
              <ul>{plResult.errors.map((err, i) => <li key={i}>{err.message}</li>)}</ul>
            ) : (
              <ul>
                {plResult.updated != null && <li>Updated: {plResult.updated}</li>}
                {plResult.notFound?.length ? <li>Not found: {plResult.notFound.join(', ')}</li> : null}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-muted">Run Preview to see validation results here.</p>
        )}
      </section>

      <ConfirmDialog
        open={rbCommitOpen}
        title="Apply reverse billing to the database?"
        message="This will create or update AR batch data from your CSV for the selected client, segment, and cutoff. This cannot be undone automatically."
        confirmLabel="Apply changes"
        cancelLabel="Cancel"
        onCancel={() => setRbCommitOpen(false)}
        onConfirm={() => {
          void runReverseBillingCommit();
        }}
      />
      <ConfirmDialog
        open={plCommitOpen}
        title="Apply payment list updates?"
        message="This will update invoice payment amounts from your CSV for the selected client and received date."
        confirmLabel="Apply updates"
        cancelLabel="Cancel"
        onCancel={() => setPlCommitOpen(false)}
        onConfirm={() => {
          void runPaymentListCommit();
        }}
      />
      <ConfirmDialog
        open={depositOpen}
        title="Mark batch as deposited?"
        message="This updates the batch status to deposited. Continue only if the payment has been received and recorded."
        confirmLabel="Mark as deposited"
        cancelLabel="Cancel"
        onCancel={() => setDepositOpen(false)}
        onConfirm={() => {
          void runMarkDeposited();
        }}
      />
    </div>
  );
}
