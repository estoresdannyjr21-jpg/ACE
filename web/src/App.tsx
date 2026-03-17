import { useState, useEffect, useRef, useCallback } from 'react';
import { FinanceDashboard } from './pages/FinanceDashboard';
import { ArBatchesPage } from './pages/ArBatchesPage';
import { OperationsDashboard } from './pages/OperationsDashboard';
import { FleetPage } from './pages/FleetPage';
import { DispatchPage } from './pages/DispatchPage';
import { RatesPage } from './pages/RatesPage';
import { ReportsPage } from './pages/ReportsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { AdminPage } from './pages/AdminPage';
import { ToastProvider } from './context/ToastContext';
import {
  login,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  searchGlobal,
  fetchNotifications,
  markNotificationRead,
  fetchProfile,
  type SearchResult,
  type NotificationItem,
  type ProfileResponse,
} from './api/client';

/** Sidebar route id → module title (blueprint: top bar shows logo + module title) */
const MODULE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  fleet: 'Fleet Acquisition',
  dispatch: 'Dispatch',
  trips: 'Trips',
  incidents: 'Incidents',
  rates: 'Rates',
  finance: 'Finance',
  reports: 'Reports',
  admin: 'Admin / Settings',
};

type RouteId = keyof typeof MODULE_TITLES;

/**
 * Company logo on login page and in top bar.
 * Save your logo as:  web/public/logo.png
 * Full path example:  ace-truckers-erp/web/public/logo.png
 * Use PNG or JPG; recommended size ~200–400px wide for login, 160px max for top bar.
 */
const LOGO_PATH = '/logo.png';

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState('admin@acetruckers.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoError, setLoginLogoError] = useState(false);
  const [blurActive, setBlurActive] = useState(false);

  const handleCardBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const nextFocused = e.relatedTarget as Node | null;
    if (!nextFocused || !e.currentTarget.contains(nextFocused)) {
      setBlurActive(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await login(email, password);
      setAuthToken(access_token);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page ${blurActive ? 'login-page-blur' : ''}`}>
      <div className="login-page-bg" aria-hidden="true" />
      <div
        className="login-card"
        onClick={() => setBlurActive(true)}
        onFocusCapture={() => setBlurActive(true)}
        onBlurCapture={handleCardBlur}
      >
        <div className="login-logo-wrap">
          {logoError ? (
            <span className="login-logo-fallback">Ace Truckers Corp</span>
          ) : (
            <img
              src={LOGO_PATH}
              alt="Ace Truckers Corp"
              className="login-logo"
              onError={() => setLoginLogoError(true)}
            />
          )}
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <span className="login-input-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              type="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              autoComplete="email"
            />
          </div>
          <div className="login-field">
            <span className="login-input-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
        <p className="login-hint">Default (seed): admin@acetruckers.com / admin123</p>
        <p className="login-footer">Ace Truckers Corp</p>
      </div>
    </div>
  );
}

const SEARCH_DEBOUNCE_MS = 300;
const THEME_KEY = 'ace-truckers-theme';

function App() {
  const [route, setRoute] = useState<RouteId>('dashboard');
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [breadcrumbSub, setBreadcrumbSub] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const s = localStorage.getItem(THEME_KEY);
    return s === 'dark' || s === 'light' ? s : 'light';
  });

  useEffect(() => {
    setHasToken(!!getAuthToken());
  }, []);

  useEffect(() => {
    setBreadcrumbSub(null);
  }, [route]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    if (hasToken) {
      fetchNotifications().then(setNotifications).catch(() => {});
    } else {
      setNotifications([]);
    }
  }, [hasToken]);

  useEffect(() => {
    if (!hasToken) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    fetchProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [hasToken]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchLoading(true);
      searchGlobal(searchQuery.trim())
        .then((res) => {
          setSearchResults(res);
          setSearchOpen(true);
        })
        .catch(() => setSearchResults(null))
        .finally(() => setSearchLoading(false));
      searchDebounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) setSearchOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(target)) setNotificationsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 240);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleBellClick = useCallback(() => {
    const next = !notificationsOpen;
    setNotificationsOpen(next);
    if (next) {
      setNotificationsLoading(true);
      fetchNotifications()
        .then(setNotifications)
        .catch(() => setNotifications([]))
        .finally(() => setNotificationsLoading(false));
    }
  }, [notificationsOpen]);

  const handleMarkRead = useCallback((id: string) => {
    markNotificationRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n)));
  }, []);

  const unreadCount = notifications.filter((n) => n.status !== 'READ').length;

  const handleSelectTrip = useCallback(() => {
    setRoute('dispatch');
    setSearchQuery('');
    setSearchResults(null);
    setSearchOpen(false);
  }, []);
  const handleSelectDriver = useCallback(() => {
    setRoute('fleet');
    setSearchQuery('');
    setSearchResults(null);
    setSearchOpen(false);
  }, []);
  const handleSelectOperator = useCallback(() => {
    setRoute('fleet');
    setSearchQuery('');
    setSearchResults(null);
    setSearchOpen(false);
  }, []);

  const handleLoggedIn = () => setHasToken(true);
  const handleLogout = () => {
    clearAuthToken();
    setHasToken(false);
    setUserMenuOpen(false);
  };

  if (hasToken === null) return <p className="loading-msg">Loading…</p>;
  if (!hasToken) return <LoginForm onLoggedIn={handleLoggedIn} />;

  const moduleTitle = MODULE_TITLES[route] ?? 'Ace Truckers ERP';
  const hasAnyResults = searchResults && (searchResults.trips.length > 0 || searchResults.drivers.length > 0 || searchResults.operators.length > 0);

  return (
    <ToastProvider>
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar-left">
          {logoError ? (
            <span className="app-brand">Ace Truckers ERP</span>
          ) : (
            <img
              src={LOGO_PATH}
              alt="Ace Truckers"
              className="app-logo"
              onError={() => setLogoError(true)}
            />
          )}
          <nav className="app-breadcrumb" aria-label="Breadcrumb">
            <span className={`app-breadcrumb-segment ${!breadcrumbSub ? 'app-breadcrumb-current' : ''}`}>{moduleTitle}</span>
            {breadcrumbSub && (
              <>
                <span className="app-breadcrumb-sep" aria-hidden="true">›</span>
                <span className="app-breadcrumb-segment app-breadcrumb-current">{breadcrumbSub}</span>
              </>
            )}
          </nav>
        </div>
        <div className="app-topbar-center" ref={searchContainerRef} style={{ position: 'relative' }}>
          <input
            type="search"
            className="app-search"
            placeholder="Search trip ref, driver, operator…"
            aria-label="Global search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults && setSearchOpen(true)}
          />
          {searchOpen && (
            <div className="global-search-dropdown">
              {searchLoading ? (
                <div className="global-search-dropdown-item">Searching…</div>
              ) : !hasAnyResults ? (
                <div className="global-search-dropdown-item">No results</div>
              ) : (
                <>
                  {searchResults!.trips.length > 0 && (
                    <>
                      <div className="global-search-dropdown-header">Trips</div>
                      {searchResults!.trips.map((t) => (
                        <button key={t.id} type="button" className="global-search-dropdown-item" onClick={handleSelectTrip}>
                          {t.internalRef} {t.runsheetDate ? new Date(t.runsheetDate).toLocaleDateString() : ''}
                        </button>
                      ))}
                    </>
                  )}
                  {searchResults!.drivers.length > 0 && (
                    <>
                      <div className="global-search-dropdown-header">Drivers</div>
                      {searchResults!.drivers.map((d) => (
                        <button key={d.id} type="button" className="global-search-dropdown-item" onClick={handleSelectDriver}>
                          {d.firstName} {d.lastName}
                        </button>
                      ))}
                    </>
                  )}
                  {searchResults!.operators.length > 0 && (
                    <>
                      <div className="global-search-dropdown-header">Operators</div>
                      {searchResults!.operators.map((o) => (
                        <button key={o.id} type="button" className="global-search-dropdown-item" onClick={handleSelectOperator}>
                          {o.name}
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <div className="app-topbar-right">
          <button
            type="button"
            className="app-icon-btn theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            {theme === 'light' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
          <div ref={notificationsRef} style={{ position: 'relative' }}>
            <button type="button" className="app-icon-btn" aria-label="Notifications" onClick={handleBellClick} aria-expanded={notificationsOpen}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="notification-badge" aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
            {notificationsOpen && (
              <div className="global-search-dropdown notifications-dropdown">
                <div className="global-search-dropdown-header">Notifications</div>
                {notificationsLoading ? (
                  <div className="global-search-dropdown-item">Loading…</div>
                ) : notifications.length === 0 ? (
                  <div className="global-search-dropdown-item">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={`global-search-dropdown-item ${n.status !== 'READ' ? 'unread' : ''}`}
                      onClick={() => handleMarkRead(n.id)}
                    >
                      <strong>{n.title}</strong>
                      <span style={{ display: 'block', fontSize: 'var(--font-size-small)', color: 'var(--color-slate)', marginTop: 2 }}>{n.body}</span>
                      <span style={{ display: 'block', fontSize: 'var(--font-size-small)', color: 'var(--color-slate)', marginTop: 2 }}>{new Date(n.createdAt).toLocaleString()}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="app-user-menu"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="app-user-avatar">
                {(profile?.firstName?.[0] ?? profile?.email?.[0] ?? 'U').toUpperCase()}
              </div>
              <div className="app-user-meta">
                <span className="app-user-name">
                  {profile
                    ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || profile.email
                    : 'User'}
                </span>
                {profile?.role && (
                  <span className="app-user-role">{profile.role}</span>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {userMenuOpen && (
              <>
                <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setUserMenuOpen(false)} />
                <div className="app-user-dropdown">
                  <div className="app-user-dropdown-row">
                    <span className="app-user-dropdown-label">Username:</span>
                    <span>{profile?.email ?? '—'}</span>
                  </div>
                  <div className="app-user-dropdown-row">
                    <span className="app-user-dropdown-label">Role:</span>
                    <span>{profile?.role ?? '—'}</span>
                  </div>
                  <div className="app-user-dropdown-row">
                    <span className="app-user-dropdown-label">Tenant:</span>
                    <span>{profile?.tenant?.name ?? '—'}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="app-sidebar-header">
          <button
            type="button"
            className="app-sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            )}
          </button>
        </div>
        <nav className="app-sidebar-nav" aria-label="Main">
          <button type="button" className={`app-sidebar-item ${route === 'dashboard' ? 'active' : ''}`} onClick={() => setRoute('dashboard')}>
            <span className="app-sidebar-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            </span>
            <span className="app-sidebar-label">Dashboard</span>
          </button>
          <button type="button" className={`app-sidebar-item ${route === 'fleet' ? 'active' : ''}`} onClick={() => setRoute('fleet')}>
            <span className="app-sidebar-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
            </span>
            <span className="app-sidebar-label">Fleet Acquisition</span>
          </button>
          <button type="button" className={`app-sidebar-item ${route === 'dispatch' ? 'active' : ''}`} onClick={() => setRoute('dispatch')}>
            <span className="app-sidebar-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </span>
            <span className="app-sidebar-label">Dispatch</span>
          </button>
          <button type="button" className={`app-sidebar-item ${route === 'trips' ? 'active' : ''}`} onClick={() => setRoute('trips')}>
            <span className="app-sidebar-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            </span>
            <span className="app-sidebar-label">Trips</span>
          </button>
          <button type="button" className={`app-sidebar-item ${route === 'incidents' ? 'active' : ''}`} onClick={() => setRoute('incidents')}>
            <span className="app-sidebar-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </span>
            <span className="app-sidebar-label">Incidents</span>
          </button>
          <button type="button" className={`app-sidebar-item ${route === 'rates' ? 'active' : ''}`} onClick={() => setRoute('rates')}>
            <span className="app-sidebar-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            </span>
            <span className="app-sidebar-label">Rates</span>
          </button>
          <button type="button" className={`app-sidebar-item ${route === 'finance' ? 'active' : ''}`} onClick={() => setRoute('finance')}>
            <span className="app-sidebar-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>
            </span>
            <span className="app-sidebar-label">Finance</span>
          </button>
          <button type="button" className={`app-sidebar-item ${route === 'reports' ? 'active' : ''}`} onClick={() => setRoute('reports')}>
            <span className="app-sidebar-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>
            </span>
            <span className="app-sidebar-label">Reports</span>
          </button>
          <button type="button" className={`app-sidebar-item ${route === 'admin' ? 'active' : ''}`} onClick={() => setRoute('admin')}>
            <span className="app-sidebar-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            </span>
            <span className="app-sidebar-label">Admin / Settings</span>
          </button>
        </nav>
      </aside>

      <div className="app-main-wrap">
        <main className="app-main">
          {route === 'dashboard' && <OperationsDashboard />}
          {route === 'fleet' && <FleetPage />}
          {(route === 'dispatch' || route === 'trips') && <DispatchPage />}
          {route === 'incidents' && <IncidentsPage />}
          {route === 'rates' && <RatesPage />}
          {route === 'finance' && <FinanceSection onSubChange={setBreadcrumbSub} />}
          {route === 'reports' && <ReportsPage onSubChange={setBreadcrumbSub} />}
          {route === 'admin' && <AdminPage />}
          <footer className="app-footer">
            <span>© {new Date().getFullYear()} Ace Truckers Corp</span>
            <span className="app-footer-meta">Internal ERP · For operational use only</span>
          </footer>
        </main>
      </div>
      {showScrollTop && (
        <button
          type="button"
          className="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}
    </div>
    </ToastProvider>
  );
}

type FinanceSubRoute = 'dashboard' | 'ar-batches';

function FinanceSection({ onSubChange }: { onSubChange?: (label: string | null) => void }) {
  const [sub, setSub] = useState<FinanceSubRoute>('dashboard');
  useEffect(() => {
    onSubChange?.(sub === 'dashboard' ? null : 'AR Batches');
  }, [sub, onSubChange]);
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Finance</h1>
        <p className="page-subtitle">KPIs, billing, payout, and AR batch workflow.</p>
      </div>
      <div className="sub-nav" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className={`sub-nav-btn ${sub === 'dashboard' ? 'active' : ''}`}
          onClick={() => setSub('dashboard')}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={`sub-nav-btn ${sub === 'ar-batches' ? 'active' : ''}`}
          onClick={() => setSub('ar-batches')}
        >
          AR Batches
        </button>
      </div>
      {sub === 'dashboard' && <FinanceDashboard />}
      {sub === 'ar-batches' && <ArBatchesPage />}
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">Coming soon. Use sidebar to switch module.</p>
    </div>
  );
}

export default App;
