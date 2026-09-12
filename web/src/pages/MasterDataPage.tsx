import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  listMasterDataClients,
  getMasterDataClient,
  createMasterDataClient,
  updateMasterDataClient,
  createServiceSegment,
  updateServiceSegment,
  createServiceCategory,
  updateServiceCategory,
  type MasterDataCategory,
  type MasterDataClient,
  type MasterDataSegment,
  type ServiceCategoryRules,
} from '../api/client';
import { useToast } from '../context/ToastContext';
import { StatusChip, fleetEntityStatusTone, humanizeEnum } from '../components/StatusChip';
import { TableEmptyState } from '../components/TableEmptyState';

const CODE_PATTERN = /^[A-Z0-9_]+$/;
const CODE_HINT = 'Uppercase letters, numbers and underscores only';
const STATUSES = ['ACTIVE', 'INACTIVE'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Decimal columns arrive as strings over JSON. */
function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatPct(v: unknown): string {
  return `${(toNum(v) * 100).toFixed(2).replace(/\.00$/, '')}%`;
}

type CategoryWithSegment = MasterDataCategory & { segmentCode: string; segmentName: string };

type ModalState =
  | { type: 'client-create' }
  | { type: 'client-edit'; client: MasterDataClient }
  | { type: 'segment-create' }
  | { type: 'segment-edit'; segment: MasterDataSegment }
  | { type: 'category-create' }
  | { type: 'category-edit'; category: CategoryWithSegment }
  | null;

export function MasterDataPage({ canWrite }: { canWrite: boolean }) {
  const fid = useId();
  const toast = useToast();
  const [clients, setClients] = useState<MasterDataClient[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MasterDataClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segmentFilter, setSegmentFilter] = useState('');
  const [modal, setModal] = useState<ModalState>(null);

  const loadClients = useCallback(
    async (opts: { keepSelection?: boolean } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const rows = await listMasterDataClients(includeInactive);
        setClients(rows);
        if (!opts.keepSelection) {
          setSelectedId((prev) => prev ?? rows[0]?.id ?? null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load clients');
      } finally {
        setLoading(false);
      }
    },
    [includeInactive],
  );

  const loadDetail = useCallback(async (clientId: string) => {
    setDetailLoading(true);
    try {
      setDetail(await getMasterDataClient(clientId));
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Failed to load client', { variant: 'error' });
    } finally {
      setDetailLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedId);
    setSegmentFilter('');
  }, [selectedId, loadDetail]);

  const segments = useMemo(() => detail?.serviceSegments ?? [], [detail]);

  const categories = useMemo<CategoryWithSegment[]>(
    () =>
      segments.flatMap((s) =>
        (s.serviceCategories ?? []).map((c) => ({
          ...c,
          segmentCode: s.code,
          segmentName: s.name,
        })),
      ),
    [segments],
  );

  const visibleCategories = useMemo(
    () => (segmentFilter ? categories.filter((c) => c.serviceSegmentId === segmentFilter) : categories),
    [categories, segmentFilter],
  );

  const refresh = useCallback(async () => {
    await loadClients({ keepSelection: true });
    if (selectedId) await loadDetail(selectedId);
  }, [loadClients, loadDetail, selectedId]);

  const saveClient = async (values: { name: string; code: string; status: string }) => {
    if (modal?.type === 'client-edit') {
      await updateMasterDataClient(modal.client.id, { name: values.name, status: values.status });
      toast.show(`Client ${modal.client.code} updated.`, { variant: 'success' });
    } else {
      const created = await createMasterDataClient(values);
      toast.show(`Client ${created.code} created.`, { variant: 'success' });
      setSelectedId(created.id);
    }
    setModal(null);
    await refresh();
  };

  const saveSegment = async (values: {
    name: string;
    code: string;
    sortOrder: number;
    status: string;
  }) => {
    if (modal?.type === 'segment-edit') {
      await updateServiceSegment(modal.segment.id, {
        name: values.name,
        sortOrder: values.sortOrder,
        status: values.status,
      });
      toast.show(`Segment ${modal.segment.code} updated.`, { variant: 'success' });
    } else if (selectedId) {
      await createServiceSegment(selectedId, values);
      toast.show(`Segment ${values.code} created.`, { variant: 'success' });
    }
    setModal(null);
    await refresh();
  };

  const saveCategory = async (
    values: ServiceCategoryRules & {
      serviceSegmentId: string;
      name: string;
      code: string;
      status: string;
    },
  ) => {
    if (modal?.type === 'category-edit') {
      const { code, ...patch } = values;
      void code;
      await updateServiceCategory(modal.category.id, patch);
      toast.show(`Category ${modal.category.code} updated.`, { variant: 'success' });
    } else if (selectedId) {
      await createServiceCategory(selectedId, values);
      toast.show(`Category ${values.code} created.`, { variant: 'success' });
    }
    setModal(null);
    await refresh();
  };

  if (loading && clients.length === 0) {
    return (
      <p className="loading-msg loading-msg--with-spinner" role="status">
        <span className="loading-spinner" aria-hidden />
        Loading master data…
      </p>
    );
  }

  return (
    <div>
      <section className="panel">
        <div className="panel-header-row">
          <h3 className="panel-title">Clients</h3>
          <div className="form-actions-row">
            <label className="filter-label" htmlFor={`${fid}-inactive`} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 0 }}>
              <input
                id={`${fid}-inactive`}
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              Show inactive
            </label>
            <button type="button" className="btn btn-secondary" onClick={() => void refresh()} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            {canWrite && (
              <button type="button" className="btn btn-primary" onClick={() => setModal({ type: 'client-create' })}>
                New client
              </button>
            )}
          </div>
        </div>
        <p className="page-subtitle page-subtitle--spaced">
          A client code must exist here before any rate matrix or AR file can be uploaded against it.
        </p>
        {error && <p className="login-error">{error}</p>}

        {clients.length === 0 ? (
          <TableEmptyState
            message="No clients registered yet."
            hint="Create a client, then add its service segments and categories."
            actionLabel={canWrite ? 'New client' : undefined}
            onAction={canWrite ? () => setModal({ type: 'client-create' }) : undefined}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th className="table-cell-num">Segments</th>
                  <th className="table-cell-num">Categories</th>
                  <th className="table-cell-num">Rates</th>
                  <th className="table-cell-num">Trips</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const segs = c.serviceSegments ?? [];
                  const catCount = segs.reduce((n, s) => n + (s.serviceCategories?.length ?? 0), 0);
                  return (
                    <tr
                      key={c.id}
                      className={`table-row--interactive ${c.id === selectedId ? 'selected' : ''}`}
                      onClick={() => setSelectedId(c.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedId(c.id);
                        }
                      }}
                    >
                      <td><strong>{c.code}</strong></td>
                      <td>{c.name}</td>
                      <td><StatusChip tone={fleetEntityStatusTone(c.status)}>{humanizeEnum(c.status)}</StatusChip></td>
                      <td className="table-cell-num">{segs.length}</td>
                      <td className="table-cell-num">{catCount}</td>
                      <td className="table-cell-num">{c._count?.routeRates ?? 0}</td>
                      <td className="table-cell-num">{c._count?.trips ?? 0}</td>
                      <td>
                        {canWrite && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModal({ type: 'client-edit', client: c });
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detail && (
        <>
          <section className="panel">
            <div className="panel-header-row">
              <h3 className="panel-title">
                Service segments — {detail.name} ({detail.code})
              </h3>
              {canWrite && (
                <button type="button" className="btn btn-primary" onClick={() => setModal({ type: 'segment-create' })}>
                  Add segment
                </button>
              )}
            </div>
            <p className="page-subtitle page-subtitle--spaced">
              Segment codes are what rate and AR uploads send as <strong>service_segment</strong>.
            </p>
            {detailLoading && segments.length === 0 ? (
              <p className="loading-msg loading-msg--with-spinner" role="status">
                <span className="loading-spinner" aria-hidden />
                Loading…
              </p>
            ) : segments.length === 0 ? (
              <TableEmptyState
                message="This client has no service segments."
                hint="Add a segment (e.g. FM_ONCALL) before creating categories."
                actionLabel={canWrite ? 'Add segment' : undefined}
                onAction={canWrite ? () => setModal({ type: 'segment-create' }) : undefined}
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th className="table-cell-num">Order</th>
                      <th className="table-cell-num">Categories</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segments.map((s) => (
                      <tr key={s.id}>
                        <td><strong>{s.code}</strong></td>
                        <td>{s.name}</td>
                        <td className="table-cell-num">{s.sortOrder}</td>
                        <td className="table-cell-num">{s.serviceCategories?.length ?? 0}</td>
                        <td><StatusChip tone={fleetEntityStatusTone(s.status)}>{humanizeEnum(s.status)}</StatusChip></td>
                        <td>
                          {canWrite && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setModal({ type: 'segment-edit', segment: s })}
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header-row">
              <h3 className="panel-title">Service categories</h3>
              <div className="form-actions-row">
                <select
                  className="filter-select"
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                  aria-label="Filter categories by segment"
                >
                  <option value="">All segments</option>
                  {segments.map((s) => (
                    <option key={s.id} value={s.id}>{s.code}</option>
                  ))}
                </select>
                {canWrite && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setModal({ type: 'category-create' })}
                    disabled={segments.length === 0}
                    title={segments.length === 0 ? 'Add a segment first' : undefined}
                  >
                    Add category
                  </button>
                )}
              </div>
            </div>
            <p className="page-subtitle page-subtitle--spaced">
              Payout terms and financial rules are stored per category, so each segment can bill and pay on its own cycle.
            </p>
            {visibleCategories.length === 0 ? (
              <TableEmptyState
                message={segments.length === 0 ? 'Add a segment before adding categories.' : 'No categories for this filter.'}
                actionLabel={canWrite && segments.length > 0 ? 'Add category' : undefined}
                onAction={canWrite && segments.length > 0 ? () => setModal({ type: 'category-create' }) : undefined}
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Segment</th>
                      <th className="table-cell-num">Payout terms</th>
                      <th>Cycle</th>
                      <th className="table-cell-num">Invoice deadline</th>
                      <th className="table-cell-num">Grace</th>
                      <th className="table-cell-num">VAT</th>
                      <th className="table-cell-num">Admin fee</th>
                      <th className="table-cell-num">Withholding</th>
                      <th>First trip only</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCategories.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.code}</strong></td>
                        <td>{c.name}</td>
                        <td>{c.segmentCode}</td>
                        <td className="table-cell-num">
                          {c.payoutTermsBusinessDays} {c.excludeWeekends ? 'business days' : 'days'}
                        </td>
                        <td>
                          {c.docSubmissionDay} → {c.cycleStartDay}
                        </td>
                        <td className="table-cell-num">{c.subcontractorInvoiceDeadlineDays} days</td>
                        <td className="table-cell-num">{c.callTimeGraceMinutes} min</td>
                        <td className="table-cell-num">{toNum(c.vatRate)}</td>
                        <td className="table-cell-num">{formatPct(c.adminFeePercent)}</td>
                        <td className="table-cell-num">{formatPct(c.withholdingPercent)}</td>
                        <td>
                          {c.firstTripOnlyPayout ? (
                            <StatusChip tone="warning">First trip only</StatusChip>
                          ) : (
                            <span className="text-muted">Per trip</span>
                          )}
                        </td>
                        <td><StatusChip tone={fleetEntityStatusTone(c.status)}>{humanizeEnum(c.status)}</StatusChip></td>
                        <td>
                          {canWrite && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setModal({ type: 'category-edit', category: c })}
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel">
            <h3 className="panel-title">Trip requirements</h3>
            <p className="page-subtitle page-subtitle--spaced">
              What this client needs before a trip can be completed. Drivers and coordinators cannot close a trip
              until every required item is satisfied; only an admin force-complete bypasses them.
            </p>
            {(detail.tripRequirements ?? []).length === 0 ? (
              <TableEmptyState message="No trip requirements configured for this client." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Label</th>
                      <th>Type</th>
                      <th>Document type</th>
                      <th>Applies to</th>
                      <th>Required</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.tripRequirements ?? []).map((r) => {
                      const scope = r.serviceCategoryId
                        ? categories.find((c) => c.id === r.serviceCategoryId)?.code ?? 'One category'
                        : 'All categories';
                      return (
                        <tr key={r.id}>
                          <td><strong>{r.code}</strong></td>
                          <td>{r.label}</td>
                          <td>{humanizeEnum(r.kind)}</td>
                          <td>{r.docType ? humanizeEnum(r.docType) : '—'}</td>
                          <td>{scope}</td>
                          <td>{r.required ? 'Yes' : 'Optional'}</td>
                          <td><StatusChip tone={fleetEntityStatusTone(r.status)}>{humanizeEnum(r.status)}</StatusChip></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {(modal?.type === 'client-create' || modal?.type === 'client-edit') && (
        <ClientFormModal
          initial={modal.type === 'client-edit' ? modal.client : undefined}
          onClose={() => setModal(null)}
          onSubmit={saveClient}
        />
      )}
      {(modal?.type === 'segment-create' || modal?.type === 'segment-edit') && (
        <SegmentFormModal
          clientCode={detail?.code ?? ''}
          initial={modal.type === 'segment-edit' ? modal.segment : undefined}
          onClose={() => setModal(null)}
          onSubmit={saveSegment}
        />
      )}
      {(modal?.type === 'category-create' || modal?.type === 'category-edit') && (
        <CategoryFormModal
          segments={segments}
          initial={modal.type === 'category-edit' ? modal.category : undefined}
          onClose={() => setModal(null)}
          onSubmit={saveCategory}
        />
      )}
    </div>
  );
}

// ——— Shared modal pieces ———

function ModalShell({
  title,
  subtitle,
  error,
  submitting,
  submitLabel,
  onClose,
  onSubmit,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  error: string | null;
  submitting: boolean;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="app-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="app-modal panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={wide ? { maxWidth: 720 } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="panel-title">{title}</h3>
        {subtitle && <p className="page-subtitle page-subtitle--spaced">{subtitle}</p>}
        <form onSubmit={onSubmit} className="form-block">
          {children}
          {error && <p className="login-error">{error}</p>}
          <div className="form-actions-row form-actions-row--end">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
  hint,
  disabled,
  readOnlyNote,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  readOnlyNote?: string;
}) {
  return (
    <div className="filter-group">
      <label className="filter-label" htmlFor={id}>
        {label} {required && <span className="text-required" aria-hidden>*</span>}
      </label>
      <input
        id={id}
        className="filter-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {(hint || readOnlyNote) && <span className="text-muted">{readOnlyNote ?? hint}</span>}
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  hint,
  step,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  step?: string;
}) {
  return (
    <div className="filter-group">
      <label className="filter-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="filter-input"
        type="number"
        min="0"
        step={step ?? '1'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="text-muted">{hint}</span>}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  required,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="filter-group">
      <label className="filter-label" htmlFor={id}>
        {label} {required && <span className="text-required" aria-hidden>*</span>}
      </label>
      <select id={id} className="filter-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({
  id,
  label,
  checked,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="filter-group">
      <label className="filter-label" htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        {label}
      </label>
      {hint && <span className="text-muted">{hint}</span>}
    </div>
  );
}

const statusOptions = STATUSES.map((s) => ({ value: s, label: s }));
const dayOptions = DAYS.map((d) => ({ value: d, label: d }));

// ——— Client form ———

function ClientFormModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: MasterDataClient;
  onClose: () => void;
  onSubmit: (values: { name: string; code: string; status: string }) => Promise<void>;
}) {
  const fid = useId();
  const editing = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'ACTIVE');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    if (!editing && !CODE_PATTERN.test(code)) return setError(`Code is required. ${CODE_HINT}`);
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), code, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={editing ? `Edit client ${initial!.code}` : 'New client'}
      subtitle={
        editing
          ? 'The client code cannot change: rate matrices, AR files and trips reference it.'
          : 'Register the client before uploading its rates or AR files.'
      }
      error={error}
      submitting={submitting}
      submitLabel={editing ? 'Save client' : 'Create client'}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="form-grid">
        <TextField
          id={`${fid}-name`}
          label="Client name"
          value={name}
          onChange={setName}
          required
          placeholder="e.g. Shopee Express"
        />
        <TextField
          id={`${fid}-code`}
          label="Client code"
          value={code}
          onChange={(v) => setCode(v.toUpperCase())}
          required={!editing}
          placeholder="e.g. SPX"
          hint={CODE_HINT}
          disabled={editing}
          readOnlyNote={editing ? 'Codes are immutable once uploads reference them' : undefined}
        />
        <SelectField
          id={`${fid}-status`}
          label="Status"
          value={status}
          options={statusOptions}
          onChange={setStatus}
        />
      </div>
    </ModalShell>
  );
}

// ——— Segment form ———

function SegmentFormModal({
  clientCode,
  initial,
  onClose,
  onSubmit,
}: {
  clientCode: string;
  initial?: MasterDataSegment;
  onClose: () => void;
  onSubmit: (values: { name: string; code: string; sortOrder: number; status: string }) => Promise<void>;
}) {
  const fid = useId();
  const editing = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [status, setStatus] = useState(initial?.status ?? 'ACTIVE');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    if (!editing && !CODE_PATTERN.test(code)) return setError(`Code is required. ${CODE_HINT}`);
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), code, sortOrder: Number(sortOrder) || 0, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={editing ? `Edit segment ${initial!.code}` : `New segment for ${clientCode}`}
      subtitle="Uploads match this code exactly, and each category must belong to one segment."
      error={error}
      submitting={submitting}
      submitLabel={editing ? 'Save segment' : 'Create segment'}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="form-grid">
        <TextField
          id={`${fid}-name`}
          label="Segment name"
          value={name}
          onChange={setName}
          required
          placeholder="e.g. FM Oncall"
        />
        <TextField
          id={`${fid}-code`}
          label="Segment code"
          value={code}
          onChange={(v) => setCode(v.toUpperCase())}
          required={!editing}
          placeholder="e.g. FM_ONCALL"
          hint={CODE_HINT}
          disabled={editing}
          readOnlyNote={editing ? 'Codes are immutable once uploads reference them' : undefined}
        />
        <NumberField
          id={`${fid}-sort`}
          label="Display order"
          value={sortOrder}
          onChange={setSortOrder}
        />
        <SelectField
          id={`${fid}-status`}
          label="Status"
          value={status}
          options={statusOptions}
          onChange={setStatus}
        />
      </div>
    </ModalShell>
  );
}

// ——— Category form (payout terms + financial rules) ———

function CategoryFormModal({
  segments,
  initial,
  onClose,
  onSubmit,
}: {
  segments: MasterDataSegment[];
  initial?: MasterDataCategory;
  onClose: () => void;
  onSubmit: (
    values: ServiceCategoryRules & {
      serviceSegmentId: string;
      name: string;
      code: string;
      status: string;
    },
  ) => Promise<void>;
}) {
  const fid = useId();
  const editing = !!initial;
  const [serviceSegmentId, setServiceSegmentId] = useState(
    initial?.serviceSegmentId ?? segments[0]?.id ?? '',
  );
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'ACTIVE');
  const [payoutTerms, setPayoutTerms] = useState(String(initial?.payoutTermsBusinessDays ?? 3));
  const [docSubmissionDay, setDocSubmissionDay] = useState(initial?.docSubmissionDay ?? 'Tuesday');
  const [cycleStartDay, setCycleStartDay] = useState(initial?.cycleStartDay ?? 'Wednesday');
  const [excludeWeekends, setExcludeWeekends] = useState(initial?.excludeWeekends ?? true);
  const [invoiceDeadline, setInvoiceDeadline] = useState(
    String(initial?.subcontractorInvoiceDeadlineDays ?? 30),
  );
  const [graceMinutes, setGraceMinutes] = useState(String(initial?.callTimeGraceMinutes ?? 15));
  const [vatRate, setVatRate] = useState(String(toNum(initial?.vatRate ?? 1.12)));
  const [adminFeePercent, setAdminFeePercent] = useState(String(toNum(initial?.adminFeePercent ?? 0.02)));
  const [withholdingPercent, setWithholdingPercent] = useState(
    String(toNum(initial?.withholdingPercent ?? 0.02)),
  );
  const [firstTripOnlyPayout, setFirstTripOnlyPayout] = useState(initial?.firstTripOnlyPayout ?? false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceSegmentId) return setError('Select a service segment');
    if (!name.trim()) return setError('Name is required');
    if (!editing && !CODE_PATTERN.test(code)) return setError(`Code is required. ${CODE_HINT}`);
    const vat = Number(vatRate);
    const adminFee = Number(adminFeePercent);
    const withholding = Number(withholdingPercent);
    if (!Number.isFinite(vat) || vat < 1) return setError('VAT rate must be 1 or higher (1.12 = 12% VAT)');
    if (!Number.isFinite(adminFee) || adminFee < 0 || adminFee > 1) {
      return setError('Admin fee must be a fraction between 0 and 1 (0.02 = 2%)');
    }
    if (!Number.isFinite(withholding) || withholding < 0 || withholding > 1) {
      return setError('Withholding must be a fraction between 0 and 1 (0.02 = 2%)');
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        serviceSegmentId,
        name: name.trim(),
        code,
        status,
        payoutTermsBusinessDays: Number(payoutTerms) || 0,
        docSubmissionDay,
        cycleStartDay,
        excludeWeekends,
        subcontractorInvoiceDeadlineDays: Number(invoiceDeadline) || 0,
        callTimeGraceMinutes: Number(graceMinutes) || 0,
        vatRate: vat,
        adminFeePercent: adminFee,
        withholdingPercent: withholding,
        firstTripOnlyPayout,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={editing ? `Edit category ${initial!.code}` : 'New service category'}
      subtitle="These values drive payout due dates and the trip finance computation for this category."
      error={error}
      submitting={submitting}
      submitLabel={editing ? 'Save category' : 'Create category'}
      onClose={onClose}
      onSubmit={handleSubmit}
      wide
    >
      <h4 className="subsection-heading">Identity</h4>
      <div className="form-grid">
        <SelectField
          id={`${fid}-segment`}
          label="Service segment"
          value={serviceSegmentId}
          options={segments.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
          onChange={setServiceSegmentId}
          required
        />
        <SelectField
          id={`${fid}-status`}
          label="Status"
          value={status}
          options={statusOptions}
          onChange={setStatus}
        />
        <TextField
          id={`${fid}-name`}
          label="Category name"
          value={name}
          onChange={setName}
          required
          placeholder="e.g. SPX FM 6WCV Oncall"
        />
        <TextField
          id={`${fid}-code`}
          label="Category code"
          value={code}
          onChange={(v) => setCode(v.toUpperCase())}
          required={!editing}
          placeholder="e.g. SPX_FM_6WCV_ONCALL"
          hint={CODE_HINT}
          disabled={editing}
          readOnlyNote={editing ? 'Codes are immutable once uploads reference them' : undefined}
        />
      </div>

      <h4 className="subsection-heading">Payout cycle</h4>
      <div className="form-grid">
        <NumberField
          id={`${fid}-terms`}
          label="Payout terms (business days)"
          value={payoutTerms}
          onChange={setPayoutTerms}
          hint="Counted from the cycle start after Finance marks the documents received"
        />
        <SelectField
          id={`${fid}-doc-day`}
          label="Doc submission day"
          value={docSubmissionDay}
          options={dayOptions}
          onChange={setDocSubmissionDay}
        />
        <SelectField
          id={`${fid}-cycle-day`}
          label="Cycle start day"
          value={cycleStartDay}
          options={dayOptions}
          onChange={setCycleStartDay}
        />
        <NumberField
          id={`${fid}-deadline`}
          label="Subcontractor invoice deadline (days)"
          value={invoiceDeadline}
          onChange={setInvoiceDeadline}
          hint="Past this, a trip needs an approved override to join a payout batch"
        />
        <NumberField
          id={`${fid}-grace`}
          label="Call time grace (minutes)"
          value={graceMinutes}
          onChange={setGraceMinutes}
        />
        <CheckboxField
          id={`${fid}-weekends`}
          label="Exclude weekends"
          checked={excludeWeekends}
          onChange={setExcludeWeekends}
          hint="Skip Saturday and Sunday when counting business days"
        />
      </div>

      <h4 className="subsection-heading">Financial rules</h4>
      <div className="form-grid">
        <NumberField
          id={`${fid}-vat`}
          label="VAT rate"
          value={vatRate}
          onChange={setVatRate}
          step="0.01"
          hint="Divisor for the non-VAT base: 1.12 = 12% VAT"
        />
        <NumberField
          id={`${fid}-admin`}
          label="Admin fee"
          value={adminFeePercent}
          onChange={setAdminFeePercent}
          step="0.001"
          hint={`Fraction of the VATable base — ${formatPct(adminFeePercent)}`}
        />
        <NumberField
          id={`${fid}-withholding`}
          label="Withholding"
          value={withholdingPercent}
          onChange={setWithholdingPercent}
          step="0.001"
          hint={`Applied to NO_OR payouts — ${formatPct(withholdingPercent)}`}
        />
        <CheckboxField
          id={`${fid}-first-trip`}
          label="Pay only the first trip of the day"
          checked={firstTripOnlyPayout}
          onChange={setFirstTripOnlyPayout}
          hint="Wetlease style: same-day extra trips pay 0 but keep reimbursables. Needs a first-trip rate under Rates."
        />
      </div>
    </ModalShell>
  );
}
