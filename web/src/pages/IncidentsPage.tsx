import { useCallback, useEffect, useRef, useState } from 'react';
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
} from '../api/client';

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

type Filters = { status?: string; severity?: string; dateFrom?: string; dateTo?: string };

export function IncidentsPage() {
  const [list, setList] = useState<Array<{
    id: string;
    tripId: string;
    incidentType: string;
    severity: string;
    status: string;
    description: string;
    reportedAt: string;
    trip: { id: string; internalRef: string; runsheetDate?: string };
    reporter?: { id: string; firstName: string; lastName: string };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [applied, setApplied] = useState<Filters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<unknown | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [trips, setTrips] = useState<Array<{ id: string; internalRef: string; runsheetDate?: string }>>([]);
  const [createTripId, setCreateTripId] = useState('');
  const [createType, setCreateType] = useState('DELAY');
  const [createSeverity, setCreateSeverity] = useState('MEDIUM');
  const [createDescription, setCreateDescription] = useState('');
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

  const loadList = useCallback((params: Filters) => {
    setLoading(true);
    setError(null);
    const q: Record<string, string> = {};
    if (params.status) q.status = params.status;
    if (params.severity) q.severity = params.severity;
    if (params.dateFrom) q.dateFrom = params.dateFrom;
    if (params.dateTo) q.dateTo = params.dateTo;
    fetchIncidents(q)
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load incidents'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadList(applied);
  }, [applied, loadList]);

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

  useEffect(() => {
    if (showCreate) {
      getTrips({})
        .then((data: unknown) => setTrips(Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? []))
        .catch(() => {});
    }
  }, [showCreate]);

  useEffect(() => {
    if (showResolveModal) {
      getTrips({})
        .then((data: unknown) => setResolveTrips(Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? []))
        .catch(() => {});
    }
  }, [showResolveModal]);

  const onApply = () => setApplied({ ...filters });
  const onReset = () => { setFilters({}); setApplied({}); };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTripId.trim() || !createDescription.trim()) return;
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
      loadList(applied);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Create failed');
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
      loadList(applied);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Resolve failed');
    } finally {
      setResolveSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!selectedId) return;
    if (!confirm('Close this incident?')) return;
    setCloseSubmitting(true);
    try {
      await closeIncident(selectedId);
      fetchIncidentById(selectedId).then(setDetail).catch(() => {});
      loadList(applied);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Close failed');
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
      loadList(applied);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Add update failed');
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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
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
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            Report incident
          </button>
        </div>
      </div>

      <section className="panel">
        <h3 className="panel-title">Filters</h3>
        <div className="filters-row" style={{ flexWrap: 'wrap' }}>
          <div className="filter-group">
            <span className="filter-label">Status</span>
            <select className="filter-select" value={filters.status ?? ''} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}>
              <option value="">All</option>
              {INCIDENT_STATUSES.map((s) => (<option key={s} value={s}>{s.replace(/_/g, ' ')}</option>))}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Severity</span>
            <select className="filter-select" value={filters.severity ?? ''} onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value || undefined }))}>
              <option value="">All</option>
              {INCIDENT_SEVERITIES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Date from</span>
            <input type="date" className="filter-input" value={filters.dateFrom ?? ''} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))} />
          </div>
          <div className="filter-group">
            <span className="filter-label">Date to</span>
            <input type="date" className="filter-input" value={filters.dateTo ?? ''} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))} />
          </div>
          <button type="button" className="btn btn-primary" onClick={onApply}>Apply</button>
          <button type="button" className="btn btn-secondary" onClick={onReset}>Reset</button>
        </div>
      </section>

      {error && <div className="error-msg">{error}</div>}
      {loading && !list.length && <p className="loading-msg">Loading incidents…</p>}

      <section className="panel" style={{ marginTop: 16 }}>
        <h3 className="panel-title">Incidents ({list.length})</h3>
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
              {list.length === 0 ? (
                <tr><td colSpan={6} className="table-empty">No incidents match filters.</td></tr>
              ) : (
                list.map((row) => (
                  <tr
                    key={row.id}
                    className={selectedId === row.id ? 'selected' : ''}
                    onClick={() => setSelectedId(row.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{row.trip?.internalRef ?? row.tripId}</td>
                    <td>{row.incidentType}</td>
                    <td><span className={`chip chip-${row.severity === 'CRITICAL' ? 'danger' : row.severity === 'HIGH' ? 'warning' : 'neutral'}`}>{row.severity}</span></td>
                    <td><span className="chip chip-neutral">{row.status}</span></td>
                    <td>{formatDate(row.reportedAt)}</td>
                    <td>{(row.description ?? '').slice(0, 60)}{(row.description?.length ?? 0) > 60 ? '…' : ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedId && (
        <section className="panel" style={{ marginTop: 16 }}>
          <h3 className="panel-title">Incident detail</h3>
          {detailLoading && <p className="loading-msg">Loading…</p>}
          {!detailLoading && detailObj && (
            <>
              <div className="form-block" style={{ display: 'grid', gap: 12 }}>
                <div><strong>Trip:</strong> {detailObj.trip?.internalRef ?? '—'} {detailObj.trip?.id && <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-slate)' }}>(ID: {detailObj.trip.id})</span>}</div>
                <div><strong>Type:</strong> {detailObj.incidentType}</div>
                <div><strong>Severity:</strong> {detailObj.severity}</div>
                <div><strong>Status:</strong> {detailObj.status}</div>
                <div><strong>Reported at:</strong> {formatDate(detailObj.reportedAt)}</div>
                {detailObj.reporter && <div><strong>Reported by:</strong> {detailObj.reporter.firstName} {detailObj.reporter.lastName}</div>}
                <div><strong>Description:</strong> {detailObj.description ?? '—'}</div>
                {detailObj.resolutionNotes && <div><strong>Resolution:</strong> {detailObj.resolutionNotes}</div>}
                {detailObj.resolver && <div><strong>Resolved by:</strong> {detailObj.resolver.firstName} {detailObj.resolver.lastName}</div>}
              </div>
              {(detailObj.updates?.length ?? 0) > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>Updates</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {detailObj.updates!.map((u) => (
                      <li key={u.id} className="panel" style={{ padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-slate)' }}>
                          {formatDate(u.updateAt)}
                          {u.updater && ` · ${u.updater.firstName} ${u.updater.lastName}`}
                          {u.newStatus && ` · Status: ${u.newStatus}`}
                        </div>
                        {u.comment && <div style={{ marginTop: 4 }}>{u.comment}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(detailObj.media?.length ?? 0) > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>Attached media</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {detailObj.media!.map((m) => (
                      <li key={m.id} style={{ marginBottom: 4 }}>
                        <span className="chip chip-neutral">{m.fileKey}</span>
                        <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-slate)', marginLeft: 8 }}>
                          {formatDate(m.uploadedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUpdateModal(true)}>
                  Add update
                </button>
                <label className="btn btn-secondary" style={{ margin: 0 }}>
                  {mediaUploading ? 'Uploading…' : 'Add media'}
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    disabled={mediaUploading}
                    onChange={handleMediaSelect}
                  />
                </label>
              </div>
              {detailObj.status !== 'RESOLVED' && detailObj.status !== 'CLOSED' && (
                <div style={{ marginTop: 16 }}>
                  <button type="button" className="btn btn-primary" onClick={() => setShowResolveModal(true)}>
                    Resolve incident
                  </button>
                </div>
              )}
              {detailObj.status === 'RESOLVED' && (
                <div style={{ marginTop: 16 }}>
                  <button type="button" className="btn btn-primary" onClick={handleClose} disabled={closeSubmitting}>
                    {closeSubmitting ? 'Closing…' : 'Close incident'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {showUpdateModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="panel" style={{ maxWidth: 480, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 className="panel-title">Add update</h3>
            <form onSubmit={handleUpdateSubmit}>
              <div className="filter-group" style={{ marginBottom: 12 }}>
                <span className="filter-label">New status (optional)</span>
                <select
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
              <div className="filter-group" style={{ marginBottom: 16 }}>
                <span className="filter-label">Comment (optional)</span>
                <textarea
                  className="filter-input"
                  value={updateComment}
                  onChange={(e) => setUpdateComment(e.target.value)}
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="Add a status update or comment"
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={updateSubmitting || (!updateComment.trim() && !updateNewStatus)}>
                  {updateSubmitting ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowUpdateModal(false); setUpdateComment(''); setUpdateNewStatus(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResolveModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="panel" style={{ maxWidth: 480, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 className="panel-title">Resolve incident</h3>
            <form onSubmit={handleResolveSubmit}>
              <div className="filter-group" style={{ marginBottom: 12 }}>
                <span className="filter-label">Resolution notes (required)</span>
                <textarea className="filter-input" value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} required rows={3} style={{ width: '100%', resize: 'vertical' }} placeholder="Describe how the incident was resolved" />
              </div>
              <div className="filter-group" style={{ marginBottom: 16 }}>
                <span className="filter-label">Replacement trip (optional)</span>
                <select className="filter-select" value={resolveReplacementTripId} onChange={(e) => setResolveReplacementTripId(e.target.value)} style={{ width: '100%' }}>
                  <option value="">None</option>
                  {resolveTrips.map((t) => (
                    <option key={t.id} value={t.id}>{t.internalRef} {t.runsheetDate ? `(${formatDate(t.runsheetDate)})` : ''}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={resolveSubmitting}>{resolveSubmitting ? 'Saving…' : 'Resolve'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowResolveModal(false); setResolveNotes(''); setResolveReplacementTripId(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreate && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="panel" style={{ maxWidth: 480, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 className="panel-title">Report incident</h3>
            <form onSubmit={handleCreateSubmit}>
              <div className="filter-group" style={{ marginBottom: 12 }}>
                <span className="filter-label">Trip</span>
                <select className="filter-select" value={createTripId} onChange={(e) => setCreateTripId(e.target.value)} required style={{ width: '100%' }}>
                  <option value="">Select trip</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>{t.internalRef} {t.runsheetDate ? `(${formatDate(t.runsheetDate)})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group" style={{ marginBottom: 12 }}>
                <span className="filter-label">Type</span>
                <select className="filter-select" value={createType} onChange={(e) => setCreateType(e.target.value)} style={{ width: '100%' }}>
                  {INCIDENT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div className="filter-group" style={{ marginBottom: 12 }}>
                <span className="filter-label">Severity</span>
                <select className="filter-select" value={createSeverity} onChange={(e) => setCreateSeverity(e.target.value)} style={{ width: '100%' }}>
                  {INCIDENT_SEVERITIES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div className="filter-group" style={{ marginBottom: 16 }}>
                <span className="filter-label">Description</span>
                <textarea className="filter-input" value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} required rows={3} style={{ width: '100%', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={createSubmitting}>{createSubmitting ? 'Saving…' : 'Submit'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
