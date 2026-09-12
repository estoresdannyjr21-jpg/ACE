import { useEffect, useMemo, useState, useId } from 'react';
import {
  importRatesCsv,
  fetchRatesLookups,
  listWetleaseFirstTripRates,
  createWetleaseFirstTripRate,
  updateWetleaseFirstTripRate,
  type RatesImportResult,
  type RatesLookups,
  type WetleaseFirstTripRateRow,
} from '../api/client';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Backend accepts either client_rate + subcontractor_rate (AR vs AP) or legacy base_rate (same for both).
const RATES_TEMPLATE_CSV = `client_code,service_segment,service_category_code,origin_area_code,destination_area_code,client_rate,subcontractor_rate,currency,effective_from,effective_to
SPX,FM_ONCALL,SPX_FM_4W_ONCALL,NCR,NCR,1500.00,1200.00,PHP,2026-01-01,2026-12-31`;

const IMPORT_MODES = [
  { value: 'upsert', label: 'Upsert (create or update)' },
  { value: 'create', label: 'Create only (fail if exists)' },
  { value: 'update', label: 'Update only (fail if not exists)' },
] as const;

export function RatesPage() {
  const fid = useId();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'create' | 'update' | 'upsert'>('upsert');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RatesImportResult | null>(null);
  const [previewRun, setPreviewRun] = useState(false);
  const [commitOpen, setCommitOpen] = useState(false);

  const [lookups, setLookups] = useState<RatesLookups | null>(null);
  const [wetleaseRows, setWetleaseRows] = useState<WetleaseFirstTripRateRow[]>([]);
  const [wetleaseLoading, setWetleaseLoading] = useState(false);
  const [wetleaseError, setWetleaseError] = useState<string | null>(null);

  const [wlClientAccountId, setWlClientAccountId] = useState('');
  const [wlServiceCategoryId, setWlServiceCategoryId] = useState('');
  const [wlClientBill, setWlClientBill] = useState('');
  const [wlSubcontractor, setWlSubcontractor] = useState('');
  const [wlEffStart, setWlEffStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [wlEffEnd, setWlEffEnd] = useState('');

  const loadWetlease = async () => {
    setWetleaseLoading(true);
    setWetleaseError(null);
    try {
      const [lk, rows] = await Promise.all([fetchRatesLookups(), listWetleaseFirstTripRates()]);
      setLookups(lk);
      setWetleaseRows(rows);
      if (!wlClientAccountId && lk.clients.length === 1) {
        setWlClientAccountId(lk.clients[0].id);
      }
    } catch (e) {
      setWetleaseError(e instanceof Error ? e.message : 'Failed to load wetlease rates');
    } finally {
      setWetleaseLoading(false);
    }
  };

  useEffect(() => {
    void loadWetlease();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedClient = useMemo(() => {
    return lookups?.clients.find((c) => c.id === wlClientAccountId) ?? null;
  }, [lookups, wlClientAccountId]);

  const registeredSegments = useMemo(() => {
    const codes = (lookups?.clients ?? []).flatMap((c) => c.serviceSegments.map((s) => s.code));
    return [...new Set(codes)].sort();
  }, [lookups]);

  // Categories flagged in master data as paying only the first trip of the day
  const wetleaseCategories = useMemo(() => {
    const cats = selectedClient?.serviceCategories ?? [];
    return cats.filter((c) => c.firstTripOnlyPayout);
  }, [selectedClient]);

  useEffect(() => {
    if (!wlServiceCategoryId) return;
    const ok = wetleaseCategories.some((c) => c.id === wlServiceCategoryId);
    if (!ok) setWlServiceCategoryId('');
  }, [wetleaseCategories, wlServiceCategoryId]);

  const handleFileChange = (f: File | null) => {
    setFile(f);
    setPreviewRun(false);
  };
  const handleModeChange = (m: 'create' | 'update' | 'upsert') => {
    setMode(m);
    setPreviewRun(false);
  };

  const handlePreview = async () => {
    if (!file) {
      toast.show('Please select a CSV file first.', { variant: 'error' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await importRatesCsv(file, { commit: false, mode });
      setResult(res);
      setPreviewRun(true);
    } catch (e) {
      setResult({
        mode: 'preview',
        importMode: mode,
        totalRows: 0,
        validRows: 0,
        created: 0,
        updated: 0,
        errors: [{ rowNumber: 0, message: e instanceof Error ? e.message : 'Import failed' }],
      });
      setPreviewRun(true);
    } finally {
      setLoading(false);
    }
  };

  const runRatesCommit = async () => {
    setCommitOpen(false);
    if (!file) {
      toast.show('Please select a CSV file first.', { variant: 'error' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await importRatesCsv(file, { commit: true, mode });
      setResult(res);
      toast.show('Rates imported', { variant: 'success' });
    } catch (e) {
      setResult({
        mode: 'commit',
        importMode: mode,
        totalRows: 0,
        validRows: 0,
        created: 0,
        updated: 0,
        errors: [{ rowNumber: 0, message: e instanceof Error ? e.message : 'Import failed' }],
      });
      toast.show(e instanceof Error ? e.message : 'Import failed.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const createWetlease = async () => {
    if (!wlClientAccountId || !wlServiceCategoryId || !wlClientBill || !wlSubcontractor || !wlEffStart) {
      toast.show('Fill wetlease required fields (client, category, client bill, subcontractor base, effective start).', { variant: 'error' });
      return;
    }
    const clientBill = Number(wlClientBill);
    const subcontractor = Number(wlSubcontractor);
    if (!Number.isFinite(clientBill) || clientBill <= 0 || !Number.isFinite(subcontractor) || subcontractor < 0) {
      toast.show('Wetlease amounts must be valid numbers (client bill > 0, subcontractor >= 0).', { variant: 'error' });
      return;
    }
    try {
      await createWetleaseFirstTripRate({
        clientAccountId: wlClientAccountId,
        serviceCategoryId: wlServiceCategoryId,
        firstTripClientBillAmount: clientBill,
        firstTripPayoutVatable: subcontractor,
        effectiveStart: wlEffStart,
        ...(wlEffEnd ? { effectiveEnd: wlEffEnd } : {}),
      });
      setWlClientBill('');
      setWlSubcontractor('');
      setWlEffEnd('');
      await loadWetlease();
      toast.show('Wetlease rate saved', { variant: 'success' });
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Save failed', { variant: 'error' });
    }
  };

  const updateWetleaseRow = async (row: WetleaseFirstTripRateRow, patch: Record<string, unknown>) => {
    try {
      await updateWetleaseFirstTripRate(row.id, patch as any);
      await loadWetlease();
      toast.show('Wetlease rate updated', { variant: 'success' });
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Update failed', { variant: 'error' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Rates</h1>
        <p className="page-subtitle">Import route rates from CSV. Use the template and run Preview before Commit.</p>
      </div>

      <section className="panel">
        <div className="panel-header-row">
          <h3 className="panel-title">Wetlease first-trip rates</h3>
          <button type="button" className="btn btn-secondary" onClick={() => void loadWetlease()} disabled={wetleaseLoading}>
            {wetleaseLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <p className="page-subtitle page-subtitle--spaced">
          Configure wetlease <strong>client bill</strong> vs <strong>subcontractor</strong> first-trip amounts with effective dates.
          Same-day additional trips for the same driver are computed at <strong>PHP 0</strong> trip payout (reimbursables still apply).
        </p>
        {wetleaseError && <p className="login-error">{wetleaseError}</p>}

        <div className="form-grid">
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-wl-client`}>Client</label>
            <select
              id={`${fid}-wl-client`}
              className="filter-select"
              value={wlClientAccountId}
              onChange={(e) => setWlClientAccountId(e.target.value)}
              disabled={wetleaseLoading}
            >
              <option value="">Select client</option>
              {(lookups?.clients ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-wl-cat`}>Wetlease category</label>
            <select
              id={`${fid}-wl-cat`}
              className="filter-select"
              value={wlServiceCategoryId}
              onChange={(e) => setWlServiceCategoryId(e.target.value)}
              disabled={wetleaseLoading || !wlClientAccountId}
            >
              <option value="">Select category</option>
              {wetleaseCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-wl-client-bill`}>Client rate (bill) <span className="text-required" aria-hidden>*</span></label>
            <input
              id={`${fid}-wl-client-bill`}
              className="filter-input"
              inputMode="decimal"
              value={wlClientBill}
              onChange={(e) => setWlClientBill(e.target.value)}
              placeholder="e.g. 4100.00"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-wl-sub`}>Subcontractor base (VATable) <span className="text-required" aria-hidden>*</span></label>
            <input
              id={`${fid}-wl-sub`}
              className="filter-input"
              inputMode="decimal"
              value={wlSubcontractor}
              onChange={(e) => setWlSubcontractor(e.target.value)}
              placeholder="e.g. 3100.00"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-wl-start`}>Effective start <span className="text-required" aria-hidden>*</span></label>
            <input
              id={`${fid}-wl-start`}
              type="date"
              className="filter-input"
              value={wlEffStart}
              onChange={(e) => setWlEffStart(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-wl-end`}>Effective end (optional)</label>
            <input
              id={`${fid}-wl-end`}
              type="date"
              className="filter-input"
              value={wlEffEnd}
              onChange={(e) => setWlEffEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions-row">
          <button type="button" className="btn btn-primary" onClick={() => void createWetlease()} disabled={wetleaseLoading}>
            Save wetlease rate
          </button>
          <span className="text-muted">Tip: end the old row, then create a new one for changes.</span>
        </div>

        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Category</th>
                <th>Client bill</th>
                <th>Subcontractor base</th>
                <th>Effective</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {wetleaseRows.length === 0 ? (
                <tr><td colSpan={6} className="text-muted">No wetlease rows.</td></tr>
              ) : wetleaseRows.map((r) => (
                <WetleaseRow
                  key={r.id}
                  row={r}
                  disabled={wetleaseLoading}
                  onSave={(patch) => void updateWetleaseRow(r, patch)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header-inline">
          <h3 className="panel-title">Import</h3>
          <a
            href="#"
            className="template-download-link"
            onClick={(e) => {
              e.preventDefault();
              downloadCsv('rates_import_template.csv', RATES_TEMPLATE_CSV);
            }}
          >
            Download template (CSV)
          </a>
        </div>
        <p className="page-subtitle page-subtitle--spaced">
          Required: client_code, service_segment, service_category_code, origin_area_code, destination_area_code, currency, effective_from. Plus either <strong>client_rate</strong> and <strong>subcontractor_rate</strong> (bill to client vs pay subcontractor) or legacy <strong>base_rate</strong> (same value for both). Optional: effective_to. Preview before Commit.
        </p>
        <p className="page-subtitle page-subtitle--spaced">
          client_code, service_segment and service_category_code must already be registered in master data.
          {registeredSegments.length > 0 && (
            <> Registered segments: <strong>{registeredSegments.join(', ')}</strong>.</>
          )}
        </p>

        <div className="form-grid form-grid--import">
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-mode`}>Import mode</label>
            <select
              id={`${fid}-mode`}
              className="filter-select"
              value={mode}
              onChange={(e) => handleModeChange(e.target.value as 'create' | 'update' | 'upsert')}
              style={{ width: '100%' }}
            >
              {IMPORT_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${fid}-file`}>CSV file <span className="text-required" aria-hidden>*</span></label>
            <input
              id={`${fid}-file`}
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              className="input-file-block"
              aria-required
            />
            {file && (
              <span className="text-muted">
                {file.name}
              </span>
            )}
          </div>
        </div>

        <div className="form-actions-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePreview}
            disabled={loading || !file}
          >
            {loading ? 'Working…' : 'Preview'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setCommitOpen(true)}
            disabled={loading || !previewRun}
            title={!previewRun ? 'Run Preview first to enable Commit' : undefined}
          >
            {loading ? 'Working…' : 'Commit'}
          </button>
          {!previewRun && <span className="text-muted">Run Preview first to enable Commit.</span>}
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">Preview & result</h3>
        <p className="page-subtitle page-subtitle--spaced">
          Validation counts and row errors appear here after Preview or Commit.
        </p>
        {result ? (
          <div className="import-result-box">
            <strong>Result ({result.mode}, {result.importMode}):</strong>
            <ul className="import-result-list">
              <li>Total rows: {result.totalRows}</li>
              <li>Valid rows: {result.validRows}</li>
              {result.mode === 'commit' && (
                <>
                  <li>Created: {result.created}</li>
                  <li>Updated: {result.updated}</li>
                </>
              )}
            </ul>
            {result.errors.length > 0 && (
              <>
                <strong className="import-result-errors-title">Errors ({result.errors.length}):</strong>
                <ul className="import-result-errors-list">
                  {result.errors.map((err, i) => (
                    <li key={i}>
                      Row {err.rowNumber}: {err.message}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <p className="text-muted">Run Preview to see validation results here.</p>
        )}
      </section>

      <ConfirmDialog
        open={commitOpen}
        title="Apply rates to database?"
        message="This will create or update route rates from your CSV according to the selected import mode. This cannot be undone automatically."
        confirmLabel="Apply changes"
        cancelLabel="Cancel"
        onCancel={() => setCommitOpen(false)}
        onConfirm={() => {
          void runRatesCommit();
        }}
      />
    </div>
  );
}

function WetleaseRow({
  row,
  disabled,
  onSave,
}: {
  row: WetleaseFirstTripRateRow;
  disabled: boolean;
  onSave: (patch: Record<string, unknown>) => void;
}) {
  const [clientBill, setClientBill] = useState(row.firstTripClientBillAmount ?? 0);
  const [subBase, setSubBase] = useState(row.firstTripPayoutVatable ?? 0);
  const [effStart, setEffStart] = useState(row.effectiveStart?.slice(0, 10) ?? '');
  const [effEnd, setEffEnd] = useState(row.effectiveEnd ? row.effectiveEnd.slice(0, 10) : '');

  const dirty =
    clientBill !== (row.firstTripClientBillAmount ?? 0) ||
    subBase !== row.firstTripPayoutVatable ||
    effStart !== (row.effectiveStart?.slice(0, 10) ?? '') ||
    effEnd !== (row.effectiveEnd ? row.effectiveEnd.slice(0, 10) : '');

  return (
    <tr>
      <td>{row.clientAccount?.code ?? row.clientAccountId}</td>
      <td>{row.serviceCategory?.code ?? row.serviceCategoryId}</td>
      <td>
        <input
          className="filter-input"
          style={{ width: 140 }}
          inputMode="decimal"
          value={String(clientBill)}
          onChange={(e) => setClientBill(Number(e.target.value))}
          disabled={disabled}
        />
      </td>
      <td>
        <input
          className="filter-input"
          style={{ width: 160 }}
          inputMode="decimal"
          value={String(subBase)}
          onChange={(e) => setSubBase(Number(e.target.value))}
          disabled={disabled}
        />
      </td>
      <td>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="date"
            className="filter-input"
            value={effStart}
            onChange={(e) => setEffStart(e.target.value)}
            disabled={disabled}
            style={{ width: 140 }}
          />
          <input
            type="date"
            className="filter-input"
            value={effEnd}
            onChange={(e) => setEffEnd(e.target.value)}
            disabled={disabled}
            style={{ width: 140 }}
          />
        </div>
      </td>
      <td>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={disabled || !dirty}
          onClick={() =>
            onSave({
              firstTripClientBillAmount: clientBill,
              firstTripPayoutVatable: subBase,
              ...(effStart ? { effectiveStart: effStart } : {}),
              ...(effEnd ? { effectiveEnd: effEnd } : {}),
            })
          }
        >
          Save
        </button>
      </td>
    </tr>
  );
}
