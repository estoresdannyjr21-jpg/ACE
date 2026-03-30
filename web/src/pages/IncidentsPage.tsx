import { useCallback, useEffect, useRef, useState, useId } from 'react';
import {
  fetchIncidents,
  fetchIncidentById,
  createIncident,
  resolveIncident,
  closeIncident,
  addIncidentUpdate,
  addIncidentMedia,
  uploadFile,
  getTrips,
  type IncidentListItem,
} from '../api/client';
import { TableEmptyState } from '../components/TableEmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { readSessionJson, writeSessionJson, clearSessionKey } from '../lib/sessionFilters';
import { useToast } from '../context/ToastContext';
import { IncidentSeverityChip, IncidentStatusChip, StatusChip } from '../components/StatusChip';

const INCIDENT_PAGE_SIZES = [25, 50, 100] as const;
const INC_FILTERS_KEY = 'ace.filters.incidents.v1';

type Filters = { status?: string; severity?: string; dateFrom?: string; dateTo?: string };

type IncidentsPersist = {
  applied?: Filters;
  filters?: Filters;
  incidentPage?: number;
  incidentPageSize?: number;
};

function readIncidentsPersist(): IncidentsPersist | null {
  return readSessionJson<IncidentsPersist>(INC_FILTERS_KEY);
}

const INCIDENT_TYPES = ['ACCIDENT', 'BREAKDOWN', 'DELAY', 'DAMAGE', 'OTHER'];
const INCIDENT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const INCIDENT_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

function formatDate(s: string | null | undefined) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString();
  } catch {
    return String(s);
  }
}

export function IncidentsPage() {
  const toast = useToast();
  const listFid = useId();
  const createFid = useId();
  const resolveFid = useId();
  const updateFid = useId();
  const [list, setList] = useState<IncidentListItem[]>([]);
  const [incidentTotalCount, setIncidentTotalCount] = useState(0);
  const [incidentPage, setIncidentPage] = useState(() => readIncidentsPersist()?.incidentPage ?? 0);
  const [incidentPageSize, setIncidentPageSize] = useState(() => {
    const n = readIncidentsPersist()?.incidentPageSize;
    return n && (INCIDENT_PAGE_SIZES as readonly number[]).includes(n) ? n : 50;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(() => {
    const p = readIncidentsPersist();
    const a = p?.applied ?? p?.filters;
    return a ? { ...a } : {};
  });
  const [applied, setApplied] = useState<Filters>(() => {
    const p = readIncidentsPersist();
    const a = p?.applied ?? p?.filters;
    return a ? { ...a } : {};
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<unknown | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [trips, setTrips] = useState<Array<{ id: string; internalRef: string; runsheetDate?: string }>>([]);
  const [createTripId, setCreateTripId] = useState('');
  const [createType, setCreateType] = useState('DELAY');
  const [createSeverity, setCreateSeverity] = useState('MEDIUM');
  const [createDescription, setCreateDescription] = useState('');
  const [createFieldErrors, setCreateFieldErrors] = useState<{ trip?: string; description?: string }>({});
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveReplacementTripId, setResolveReplacementTripId] = useState('');
  const [resolveSubmitting, setResolveSubmitting] = useState(false);
  const [closeSubmitting, setCloseSubmitting] = useState(false);
  const [resolveTrips, setResolveTrips] = useState<Array<{ id: string; internalRef: string; runsheetDate?: string }>>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateComment, setUpdateComment] = useState('');
  const [updateNewStatus, setUpdateNewStatus] = useState('');
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  const loadList = useCallback((params: Filters, page: number, pageSize: number) => {
    setLoading(true);
    setError(null);
    const q: Record<string, string> = {
      limit: String(pageSize),
      offset: String(page * pageSize),
    };
    if (params.status) q.status = params.status;
    if (params.severity) q.severity = params.severity;
    if (params.dateFrom) q.dateFrom = params.dateFrom;
    if (params.dateTo) q.dateTo = params.dateTo;
    fetchIncidents(q)
      .then((data) => {
        setList(data.items);
        setIncidentTotalCount(data.totalCount);
      })
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : 'Could not load incidents. Check your connection and try again.',
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadList(applied, incidentPage, incidentPageSize);
  }, [applied, incidentPage, incidentPageSize, loadList]);

  useEffect(() => {
    writeSessionJson(INC_FILTERS_KEY, { applied, incidentPage, incidentPageSize });
  }, [applied, incidentPage, incidentPageSize]);

  const refetchDetail = useCallback(() => {
    if (selectedId) {
      fetchIncidentById(selectedId)
        .then(setDetail)
        .catch(() => {});
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    fetchIncidentById(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const mapTripsForSelect = (items: { id: string; internalRef: string; runsheetDate: string }[]) =>
    items.map((t) => ({ id: t.id, internalRef: t.internalRef, runsheetDate: t.runsheetDate }));

  useEffect(() => {
    if (showCreate) {
      getTrips({ limit: '500' })
        .then((d) => setTrips(mapTripsForSelect(d.items)))
        .catch(() => {});
    }
  }, [showCreate]);

  useEffect(() => {
    if (showResolveModal) {
      getTrips({ limit: '500' })
        .then((d) => setResolveTrips(mapTripsForSelect(d.items)))
        .catch(() => {});
    }
  }, [showResolveModal]);

  useEffect(() => {
    if (!showUpdateModal && !showResolveModal && !showCreate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (showUpdateModal) {
        setShowUpdateModal(false);
        setUpdateComment('');
        setUpdateNewStatus('');
      } else if (showResolveModal) {
        setShowResolveModal(false);
        setResolveNotes('');
        setResolveReplacementTripId('');
      } else {
        setCreateFieldErrors({});
        setShowCreate(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showUpdateModal, showResolveModal, showCreate]);

  const onApply = () => {
    setIncidentPage(0);
    setApplied({ ...filters });
  };
  const onReset = () => {
    setFilters({});
    setApplied({});
    setIncidentPage(0);
    clearSessionKey(INC_FILTERS_KEY);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: { trip?: string; description?: string } = {};
    if (!createTripId.trim()) err.trip = 'Please select a trip.';
    if (!createDescription.trim()) err.description = 'Please enter a description.';
    setCreateFieldErrors(err);
    if (Object.keys(err).length) return;
    setCreateSubmitting(true);
    try {
      await createIncident({
        tripId: createTripId,
        incidentType: createType,
        severity: createSeverity,
        description: createDescription.trim(),
      });
      setShowCreate(false);
      setCreateTripId('');
      setCreateDescription('');
      setCreateFieldErrors({});
      loadList(applied, incidentPage, incidentPageSize);
      toast.show('Incident reported', { variant: 'success' });
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Could not create incident.', { variant: 'error' });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !resolveNotes.trim()) return;
    setResolveSubmitting(true);
    try {
      await resolveIncident(selectedId, {
        resolutionNotes: resolveNotes.trim(),
        replacementTripId: resolveReplacementTripId || undefined,
      });
      setShowResolveModal(false);
      setResolveNotes('');
      setResolveReplacementTripId('');
      fetchIncidentById(selectedId).then(setDetail).catch(() => {});
      loadList(applied, incidentPage, incidentPageSize);
      toast.show('Incident resolved', { variant: 'success' });
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Could not resolve incident.', { variant: 'error' });
    } finally {
      setResolveSubmitting(false);
    }
  };

  const runCloseIncident = async () => {
    if (!selectedId) return;
    setCloseConfirmOpen(false);
    setCloseSubmitting(true);
    try {
      await closeIncident(selectedId);
      fetchIncidentById(selectedId).then(setDetail).catch(() => {});
      loadList(applied, incidentPage, incidentPageSize);
      toast.show('Incident closed', { variant: 'success' });
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Could not close incident.', { variant: 'error' });
    } finally {
      setCloseSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || (!updateComment.trim() && !updateNewStatus)) return;
    setUpdateSubmitting(true);
    try {
      await addIncidentUpdate(selectedId, {
        comment: updateComment.trim() || undefined,
        newStatus: updateNewStatus || undefined,
      });
      setShowUpdateModal(false);
      setUpdateComment('');
      setUpdateNewStatus('');
      refetchDetail();
      loadList(applied, incidentPage, incidentPageSize);
      toast.show('Update saved', { variant: 'success' });
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Could not save update.', { variant: 'error' });
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    e.target.value = '';
    setMediaUploading(true);
    try {
      const { fileKey } = await uploadFile(file, 'incident');
      await addIncidentMedia(selectedId, fileKey);
      refetchDetail();
      toast.show('Media attached', { variant: 'success' });
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Upload failed.', { variant: 'error' });
    } finally {
      setMediaUploading(false);
    }
  };

  const detailObj = detail as {
    id?: string;
    trip?: { id: string; internalRef: string };
    incidentType?: string;
    severity?: string;
    status?: string;
    description?: string;
    reportedAt?: string;
    resolutionNotes?: string;
    reporter?: { firstName: string; lastName: string };
    resolver?: { firstName: string; lastName: string };
    updates?: Array<{
      id: string;
      updateAt: string;
      newStatus: string | null;
      comment: string | null;
      updater?: { firstName: string; lastName: string };
    }>;
    media?: Array<{ id: string; fileKey: string; uploadedAt: string }>;
  } | null;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Incidents</h1>
            <p className="page-subtitle">List and report trip incidents. Filter by status, severity, date.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => { setCreateFieldErrors({}); setShowCreate(true); }}>
            Report incident
          </button>
        </div>
      </div>

      <section className="panel">
        <h3 className="panel-title">Filters</h3>
        <p className="page-subtitle page-subtitle--spaced">
          Narrow the list by status, severity, or reported date range, then Apply. Clear all resets every filter.
        </p>
        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${listFid}-status`}>Status</label>
            <select id={`${listFid}-status`} className="filter-select" value={filters.status ?? ''} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}>
              <option value="">All</option>
              {INCIDENT_STATUSES.map((s) => (<option key={s} value={s}>{s.replace(/_/g, ' ')}</option>))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${listFid}-severity`}>Severity</label>
            <select id={`${listFid}-severity`} className="filter-select" value={filters.severity ?? ''} onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value || undefined }))}>
              <option value="">All</option>
              {INCIDENT_SEVERITIES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${listFid}-date-from`}>Date from</label>
            <input id={`${listFid}-date-from`} type="date" className="filter-input" value={filters.dateFrom ?? ''} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))} />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor={`${listFid}-date-to`}>Date to</label>
            <input id={`${listFid}-date-to`} type="date" className="filter-input" value={filters.dateTo ?? ''} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))} />
          </div>
          <div className="filters-actions">
            <button type="button" className="btn btn-primary" onClick={onApply}>Apply</button>
            <button type="button" className="btn btn-secondary" onClick={onReset}>Clear all</button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">Incidents ({incidentTotalCount})</h3>
        <p className="page-subtitle page-subtitle--spaced">
          Select a row for full detail and actions. Adjust filters above, then Apply.
        </p>
        {error && <div className="error-msg">{error}</div>}
        {loading && !list.length && (
          <p className="loading-msg loading-msg--with-spinner" role="status">
            <span className="loading-spinner" aria-hidden />
            Loading incidents…
          </p>
        )}
        {!loading && !error && list.length === 0 ? (
          <TableEmptyState
            message="No incidents match your filters."
            hint="Widen the date range or clear status/severity, or report a new incident from a trip."
            actionLabel="Report incident"
            onAction={() => { setCreateFieldErrors({}); setShowCreate(true); }}
          />
        ) : list.length > 0 ? (
          <>
            <div className="ledger-toolbar">
              <span className="text-muted">
                Showing {incidentPage * incidentPageSize + 1}
                –
                {incidentPage * incidentPageSize + list.length} of {incidentTotalCount}
              </span>
              <select
                className="filter-select"
                value={incidentPageSize}
                onChange={(e) => {
                  setIncidentPageSize(Number(e.target.value));
                  setIncidentPage(0);
                }}
                style={{ width: 80 }}
                aria-label="Rows per page"
              >
                {INCIDENT_PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-muted">per page</span>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={incidentPage === 0}
                onClick={() => setIncidentPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={(incidentPage + 1) * incidentPageSize >= incidentTotalCount}
                onClick={() => setIncidentPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Trip ref</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Reported at</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr
                      key={row.id}
                      className={`table-row--interactive${selectedId === row.id ? ' selected' : ''}`}
                      tabIndex={0}
                      onClick={() => setSelectedId(row.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedId(row.id);
                        }
                      }}
                    >
                      <td>{row.trip?.internalRef ?? row.tripId}</td>
                      <td><StatusChip tone="neutral">{row.incidentType}</StatusChip></td>
                      <td><IncidentSeverityChip severity={row.severity} /></td>
                      <td><IncidentStatusChip status={row.status} /></td>
                      <td>{formatDate(row.reportedAt)}</td>
                      <td>{(row.description ?? '').slice(0, 60)}{(row.description?.length ?? 0) > 60 ? '…' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>

      {selectedId && (
        <section className="panel">
          <h3 className="panel-title">Incident detail</h3>
          {detailLoading && <p className="loading-msg">Loading…</p>}
          {!detailLoading && detailObj && (
            <>
              <div className="form-block detail-meta-grid">
                <div><strong>Trip:</strong> {detailObj.trip?.internalRef ?? '—'} {detailObj.trip?.id && <span className="text-meta-inline">(ID: {detailObj.trip.id})</span>}</div>
                <div><strong>Type:</strong> {detailObj.incidentType ? <StatusChip tone="neutral">{detailObj.incidentType}</StatusChip> : '—'}</div>
                <div><strong>Severity:</strong> {detailObj.severity ? <IncidentSeverityChip severity={detailObj.severity} /> : '—'}</div>
                <div><strong>Status:</strong> {detailObj.status ? <IncidentStatusChip status={detailObj.status} /> : '—'}</div>
                <div><strong>Reported at:</strong> {formatDate(detailObj.reportedAt)}</div>
                {detailObj.reporter && <div><strong>Reported by:</strong> {detailObj.reporter.firstName} {detailObj.reporter.lastName}</div>}
                <div><strong>Description:</strong> {detailObj.description ?? '—'}</div>
                {detailObj.resolutionNotes && <div><strong>Resolution:</strong> {detailObj.resolutionNotes}</div>}
                {detailObj.resolver && <div><strong>Resolved by:</strong> {detailObj.resolver.firstName} {detailObj.resolver.lastName}</div>}
              </div>
              {(detailObj.updates?.length ?? 0) > 0 && (
                <div>
                  <h4 className="subsection-heading">Updates</h4>
                  <ul className="flat-list">
                    {detailObj.updates!.map((u) => (
                      <li key={u.id} className="panel card-list-item">
                        <div className="text-muted">
                          {formatDate(u.updateAt)}
                          {u.updater && ` · ${u.updater.firstName} ${u.updater.lastName}`}
                          {u.newStatus && ` · Status: ${u.newStatus}`}
                        </div>
                        {u.comment && <div className="update-comment">{u.comment}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(detailObj.media?.length ?? 0) > 0 && (
                <div>
                  <h4 className="subsection-heading">Attached media</h4>
                  <ul className="flat-list">
                    {detailObj.media!.map((m) => (
                      <li key={m.id} className="media-list-item">
                        <span className="chip chip-neutral">{m.fileKey}</span>
                        <span className="text-meta-inline">
                          {formatDate(m.uploadedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="detail-toolbar-row">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUpdateModal(true)}>
                  Add update
                </button>
                <label className="btn btn-secondary" style={{ margin: 0 }}>
                  {mediaUploading ? 'Uploading…' : 'Add media'}
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    aria-label="Upload incident media (image or PDF)"
                    style={{ display: 'none' }}
                    disabled={mediaUploading}
                    onChange={handleMediaSelect}
                  />
                </label>
              </div>
              {detailObj.status !== 'RESOLVED' && detailObj.status !== 'CLOSED' && (
                <div className="detail-toolbar">
                  <button type="button" className="btn btn-primary" onClick={() => setShowResolveModal(true)}>
                    Resolve incident
                  </button>
                </div>
              )}
              {detailObj.status === 'RESOLVED' && (
                <div className="detail-toolbar">
                  <button type="button" className="btn btn-primary" onClick={() => setCloseConfirmOpen(true)} disabled={closeSubmitting}>
                    {closeSubmitting ? 'Closing…' : 'Close incident'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {showUpdateModal && (
        <div className="app-modal-overlay" role="dialog" aria-modal="true">
          <div className="panel app-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="panel-title">Add update</h3>
            <form onSubmit={handleUpdateSubmit}>
              <div className="filter-group filter-group--mb-12">
                <label className="filter-label" htmlFor={`${updateFid}-status`}>New status (optional)</label>
                <select
                  id={`${updateFid}-status`}
                  className="filter-select"
                  value={updateNewStatus}
                  onChange={(e) => setUpdateNewStatus(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">— No change —</option>
                  {INCIDENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group filter-group--mb-16">
                <label className="filter-label" htmlFor={`${updateFid}-comment`}>Comment (optional)</label>
                <textarea
                  id={`${updateFid}-comment`}
                  className="filter-input"
                  value={updateComment}
                  onChange={(e) => setUpdateComment(e.target.value)}
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="Add a status update or comment"
                />
              </div>
              <div className="form-actions-row form-actions-row--end">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowUpdateModal(false); setUpdateComment(''); setUpdateNewStatus(''); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updateSubmitting || (!updateComment.trim() && !updateNewStatus)}>
                  {updateSubmitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResolveModal && (
        <div className="app-modal-overlay" role="dialog" aria-modal="true">
          <div className="panel app-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="panel-title">Resolve incident</h3>
            <form onSubmit={handleResolveSubmit}>
              <div className="filter-group filter-group--mb-12">
                <label className="filter-label" htmlFor={`${resolveFid}-notes`}>Resolution notes <span className="text-required" aria-hidden>*</span></label>
                <textarea id={`${resolveFid}-notes`} className="filter-input" value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} required rows={3} style={{ width: '100%', resize: 'vertical' }} placeholder="Describe how the incident was resolved" />
              </div>
              <div className="filter-group filter-group--mb-16">
                <label className="filter-label" htmlFor={`${resolveFid}-replacement`}>Replacement trip (optional)</label>
                <select id={`${resolveFid}-replacement`} className="filter-select" value={resolveReplacementTripId} onChange={(e) => setResolveReplacementTripId(e.target.value)} style={{ width: '100%' }}>
                  <option value="">None</option>
                  {resolveTrips.map((t) => (
                    <option key={t.id} value={t.id}>{t.internalRef} {t.runsheetDate ? `(${formatDate(t.runsheetDate)})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="form-actions-row form-actions-row--end">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowResolveModal(false); setResolveNotes(''); setResolveReplacementTripId(''); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={resolveSubmitting}>{resolveSubmitting ? 'Saving…' : 'Resolve'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="app-modal-overlay" role="dialog" aria-modal="true">
          <div className="panel app-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="panel-title">Report incident</h3>
            <form onSubmit={handleCreateSubmit} noValidate>
              <div className="filter-group filter-group--mb-12">
                <label className="filter-label" htmlFor={`${createFid}-trip`}>Trip <span className="text-required" aria-hidden>*</span></label>
                <select
                  id={`${createFid}-trip`}
                  className={`filter-select${createFieldErrors.trip ? ' error' : ''}`}
                  value={createTripId}
                  onChange={(e) => { setCreateTripId(e.target.value); setCreateFieldErrors((x) => ({ ...x, trip: undefined })); }}
                  aria-invalid={!!createFieldErrors.trip}
                  aria-describedby={createFieldErrors.trip ? `${createFid}-trip-err` : undefined}
                  style={{ width: '100%' }}
                >
                  <option value="">Select trip</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>{t.internalRef} {t.runsheetDate ? `(${formatDate(t.runsheetDate)})` : ''}</option>
                  ))}
                </select>
                {createFieldErrors.trip && <p id={`${createFid}-trip-err`} className="form-field-error" role="alert">{createFieldErrors.trip}</p>}
              </div>
              <div className="filter-group filter-group--mb-12">
                <label className="filter-label" htmlFor={`${createFid}-type`}>Type</label>
                <select id={`${createFid}-type`} className="filter-select" value={createType} onChange={(e) => setCreateType(e.target.value)} style={{ width: '100%' }}>
                  {INCIDENT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div className="filter-group filter-group--mb-12">
                <label className="filter-label" htmlFor={`${createFid}-severity`}>Severity</label>
                <select id={`${createFid}-severity`} className="filter-select" value={createSeverity} onChange={(e) => setCreateSeverity(e.target.value)} style={{ width: '100%' }}>
                  {INCIDENT_SEVERITIES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div className="filter-group filter-group--mb-16">
                <label className="filter-label" htmlFor={`${createFid}-desc`}>Description <span className="text-required" aria-hidden>*</span></label>
                <textarea
                  id={`${createFid}-desc`}
                  className={`filter-input${createFieldErrors.description ? ' error' : ''}`}
                  value={createDescription}
                  onChange={(e) => { setCreateDescription(e.target.value); setCreateFieldErrors((x) => ({ ...x, description: undefined })); }}
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                  aria-invalid={!!createFieldErrors.description}
                  aria-describedby={createFieldErrors.description ? `${createFid}-desc-err` : undefined}
                />
                {createFieldErrors.description && <p id={`${createFid}-desc-err`} className="form-field-error" role="alert">{createFieldErrors.description}</p>}
              </div>
              <div className="form-actions-row form-actions-row--end">
                <button type="button" className="btn btn-secondary" onClick={() => { setCreateFieldErrors({}); setShowCreate(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createSubmitting}>{createSubmitting ? 'Submitting…' : 'Submit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={closeConfirmOpen}
        title="Close incident"
        message="This marks the incident as closed. You can still view it from the list. Continue?"
        confirmLabel="Close incident"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setCloseConfirmOpen(false)}
        onConfirm={() => {
          void runCloseIncident();
        }}
      />
    </div>
  );
}
