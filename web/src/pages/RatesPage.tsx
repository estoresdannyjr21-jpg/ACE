import { useState, useId } from 'react';
import { importRatesCsv, type RatesImportResult } from '../api/client';
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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Rates</h1>
        <p className="page-subtitle">Import route rates from CSV. Use the template and run Preview before Commit.</p>
      </div>

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
          Required: client_code, service_segment, service_category_code, origin_area_code, destination_area_code, currency, effective_from. Plus either <strong>client_rate</strong> and <strong>subcontractor_rate</strong> (bill to client vs pay subcontractor) or legacy <strong>base_rate</strong> (same value for both). Optional: effective_to. Segments: FM_ONCALL, FM_WETLEASE, MFM_ONCALL. Preview before Commit.
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
