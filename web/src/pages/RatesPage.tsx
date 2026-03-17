import { useState } from 'react';
import { importRatesCsv, type RatesImportResult } from '../api/client';
import { useToast } from '../context/ToastContext';

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Columns per backend: client_code, service_segment, service_category_code, origin_area_code, destination_area_code, base_rate, currency, effective_from, effective_to
const RATES_TEMPLATE_CSV = `client_code,service_segment,service_category_code,origin_area_code,destination_area_code,base_rate,currency,effective_from,effective_to
SPX,FM_ONCALL,SPX_FM_4W_ONCALL,NCR,NCR,1200.00,PHP,2026-01-01,2026-12-31`;

const IMPORT_MODES = [
  { value: 'upsert', label: 'Upsert (create or update)' },
  { value: 'create', label: 'Create only (fail if exists)' },
  { value: 'update', label: 'Update only (fail if not exists)' },
] as const;

export function RatesPage() {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'create' | 'update' | 'upsert'>('upsert');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RatesImportResult | null>(null);
  const [previewRun, setPreviewRun] = useState(false);

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
      alert('Please select a CSV file.');
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

  const handleCommit = async () => {
    if (!file) {
      alert('Please select a CSV file.');
      return;
    }
    if (!confirm('Apply changes to the database? This will create or update route rates.')) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await importRatesCsv(file, { commit: true, mode });
      setResult(res);
      toast.show('Rates imported');
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
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 1rem', marginBottom: 12 }}>
          <h3 className="panel-title" style={{ marginBottom: 0 }}>Import route rates (CSV)</h3>
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
        <p className="page-subtitle" style={{ marginBottom: 16 }}>
          Required columns: client_code, service_segment, service_category_code, origin_area_code, destination_area_code, base_rate, currency, effective_from. Optional: effective_to. Segments: FM_ONCALL, FM_WETLEASE, MFM_ONCALL. You must run Preview first; Commit is only enabled after a preview.
        </p>

        <div className="form-grid" style={{ marginBottom: 16, maxWidth: 560 }}>
          <div className="filter-group">
            <span className="filter-label">Import mode</span>
            <select
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
            <span className="filter-label">CSV file</span>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              style={{ display: 'block', marginTop: 4 }}
            />
            {file && (
              <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-slate)' }}>
                {file.name}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePreview}
            disabled={loading || !file}
          >
            {loading ? '…' : 'Preview'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCommit}
            disabled={loading || !previewRun}
            title={!previewRun ? 'Run Preview first to enable Commit' : undefined}
          >
            {loading ? '…' : 'Commit'}
          </button>
          {!previewRun && <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-slate)' }}>Run Preview first to enable Commit.</span>}
        </div>

        {result && (
          <div className="import-result-box" style={{ marginTop: 16 }}>
            <strong>Result ({result.mode}, {result.importMode}):</strong>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
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
                <strong style={{ display: 'block', marginTop: 12 }}>Errors ({result.errors.length}):</strong>
                <ul style={{ marginTop: 4, paddingLeft: 20, maxHeight: 200, overflow: 'auto' }}>
                  {result.errors.map((err, i) => (
                    <li key={i}>
                      Row {err.rowNumber}: {err.message}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
