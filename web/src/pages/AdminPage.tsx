import { useEffect, useState } from 'react';
import { fetchProfile, type ProfileResponse } from '../api/client';
import { MasterDataPage } from './MasterDataPage';

type AdminTab = 'master-data' | 'profile';

/** Roles allowed to write master data (mirrors WRITE_ROLES on the API controller). */
const MASTER_DATA_WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('master-data');
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const pageHeader = (
    <div className="page-header">
      <h1 className="page-title">Admin / Settings</h1>
      <p className="page-subtitle">
        Master data for clients, service segments and service categories, plus your profile and tenant.
      </p>
    </div>
  );

  if (loading) {
    return (
      <div>
        {pageHeader}
        <p className="loading-msg loading-msg--with-spinner" role="status">
          <span className="loading-spinner" aria-hidden />
          Loading…
        </p>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        {pageHeader}
        <div className="error-msg">{error}</div>
      </div>
    );
  }
  if (!profile) return null;

  const canWrite = MASTER_DATA_WRITE_ROLES.includes(profile.role);

  return (
    <div>
      {pageHeader}
      <div className="sub-nav">
        <button
          type="button"
          className={`sub-nav-btn ${tab === 'master-data' ? 'active' : ''}`}
          onClick={() => setTab('master-data')}
        >
          Master Data
        </button>
        <button
          type="button"
          className={`sub-nav-btn ${tab === 'profile' ? 'active' : ''}`}
          onClick={() => setTab('profile')}
        >
          Profile &amp; Tenant
        </button>
      </div>

      {tab === 'master-data' && (
        <>
          {!canWrite && (
            <p className="page-subtitle page-subtitle--spaced">
              Your role ({profile.role}) has read-only access to master data.
            </p>
          )}
          <MasterDataPage canWrite={canWrite} />
        </>
      )}

      {tab === 'profile' && (
        <>
          <section className="panel" style={{ maxWidth: 480 }}>
            <h3 className="panel-title">Profile</h3>
            <div className="form-block detail-meta-grid">
              <div><strong>Name</strong><br />{profile.firstName} {profile.lastName}</div>
              <div><strong>Email</strong><br />{profile.email}</div>
              <div><strong>Role</strong><br /><span className="chip chip-neutral">{profile.role}</span></div>
            </div>
          </section>

          <section className="panel" style={{ maxWidth: 480 }}>
            <h3 className="panel-title">Tenant</h3>
            <div className="form-block">
              <div><strong>Tenant</strong><br />{profile.tenant?.name ?? profile.tenantId ?? '—'}</div>
            </div>
          </section>

          <section className="panel" style={{ maxWidth: 480 }}>
            <h3 className="panel-title">More settings</h3>
            <p className="page-subtitle">User management, change password, and other options will appear here in a future update.</p>
          </section>
        </>
      )}
    </div>
  );
}
