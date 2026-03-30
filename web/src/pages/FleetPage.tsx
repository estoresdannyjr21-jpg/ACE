import { useEffect, useState, useCallback } from 'react';
import {
  getOperators,
  getDrivers,
  getVehicles,
  createOperator,
  createDriver,
  createVehicle,
} from '../api/client';
import { useToast } from '../context/ToastContext';
import { FleetStatusChip } from '../components/StatusChip';

type FleetTab = 'operators' | 'drivers' | 'vehicles';

type Operator = {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  createdAt: string;
};

type Driver = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  status: string;
  assignments?: Array<{ operator: { name: string } }>;
};

type Vehicle = {
  id: string;
  plateNumber: string;
  vehicleType: string;
  bodyType?: string | null;
  status: string;
  assignments?: Array<{ operator: { name: string } }>;
};

export function FleetPage() {
  const toast = useToast();
  const [tab, setTab] = useState<FleetTab>('operators');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<'operator' | 'driver' | 'vehicle' | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ops, drv, vhc] = await Promise.all([
        getOperators(),
        getDrivers(),
        getVehicles(),
      ]);
      setOperators(Array.isArray(ops) ? ops : []);
      setDrivers(Array.isArray(drv) ? drv : []);
      setVehicles(Array.isArray(vhc) ? vhc : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateOperator = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = {
      name: (form.querySelector('[name="name"]') as HTMLInputElement).value.trim(),
      contactName: (form.querySelector('[name="contactName"]') as HTMLInputElement)?.value?.trim() || undefined,
      email: (form.querySelector('[name="email"]') as HTMLInputElement)?.value?.trim() || undefined,
      phone: (form.querySelector('[name="phone"]') as HTMLInputElement)?.value?.trim() || undefined,
      address: (form.querySelector('[name="address"]') as HTMLInputElement)?.value?.trim() || undefined,
      taxId: (form.querySelector('[name="taxId"]') as HTMLInputElement)?.value?.trim() || undefined,
      bankName: (form.querySelector('[name="bankName"]') as HTMLInputElement)?.value?.trim() || undefined,
      bankAccount: (form.querySelector('[name="bankAccount"]') as HTMLInputElement)?.value?.trim() || undefined,
      bankBranch: (form.querySelector('[name="bankBranch"]') as HTMLInputElement)?.value?.trim() || undefined,
    };
    if (!data.name) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createOperator(data);
      setShowForm(null);
      load();
      toast.show('Operator created.', { variant: 'success' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDriver = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const operatorId = (form.querySelector('[name="operatorId"]') as HTMLSelectElement)?.value?.trim() || undefined;
    const data = {
      firstName: (form.querySelector('[name="firstName"]') as HTMLInputElement).value.trim(),
      lastName: (form.querySelector('[name="lastName"]') as HTMLInputElement).value.trim(),
      phone: (form.querySelector('[name="phone"]') as HTMLInputElement)?.value?.trim() || undefined,
      email: (form.querySelector('[name="email"]') as HTMLInputElement)?.value?.trim() || undefined,
      licenseNumber: (form.querySelector('[name="licenseNumber"]') as HTMLInputElement)?.value?.trim() || undefined,
      operatorId: operatorId || undefined,
      assignmentStartDate: operatorId ? new Date().toISOString().slice(0, 10) : undefined,
    };
    if (!data.firstName || !data.lastName) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createDriver(data);
      setShowForm(null);
      load();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const operatorId = (form.querySelector('[name="operatorId"]') as HTMLSelectElement)?.value?.trim() || undefined;
    const data = {
      plateNumber: (form.querySelector('[name="plateNumber"]') as HTMLInputElement).value.trim(),
      vehicleType: (form.querySelector('[name="vehicleType"]') as HTMLInputElement).value.trim(),
      bodyType: (form.querySelector('[name="bodyType"]') as HTMLInputElement)?.value?.trim() || undefined,
      operatorId: operatorId || undefined,
      assignmentStartDate: operatorId ? new Date().toISOString().slice(0, 10) : undefined,
    };
    if (!data.plateNumber || !data.vehicleType) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createVehicle(data);
      setShowForm(null);
      load();
      toast.show('Vehicle created.', { variant: 'success' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  const pageHeader = (
    <div className="page-header">
      <h1 className="page-title">Fleet Acquisition</h1>
      <p className="page-subtitle">Manage operators, drivers, and vehicles.</p>
    </div>
  );

  if (loading && operators.length === 0 && drivers.length === 0 && vehicles.length === 0) {
    return (
      <div className="fleet-page">
        {pageHeader}
        <p className="loading-msg loading-msg--with-spinner" role="status">
          <span className="loading-spinner" aria-hidden />
          Loading fleet…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fleet-page">
        {pageHeader}
        <section className="panel">
          <p className="login-error">{error}</p>
          <button type="button" className="btn btn-secondary" onClick={load}>Retry</button>
        </section>
      </div>
    );
  }

  return (
    <div className="fleet-page">
      {pageHeader}
      <div className="sub-nav">
        <button
          type="button"
          className={`sub-nav-btn ${tab === 'operators' ? 'active' : ''}`}
          onClick={() => setTab('operators')}
        >
          Operators
        </button>
        <button
          type="button"
          className={`sub-nav-btn ${tab === 'drivers' ? 'active' : ''}`}
          onClick={() => setTab('drivers')}
        >
          Drivers
        </button>
        <button
          type="button"
          className={`sub-nav-btn ${tab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setTab('vehicles')}
        >
          Vehicles
        </button>
      </div>

      {tab === 'operators' && (
        <>
          <section className="panel">
            <div className="panel-header-row">
              <h3 className="panel-title">Add operator</h3>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowForm(showForm === 'operator' ? null : 'operator')}
              >
                {showForm === 'operator' ? 'Cancel' : 'Add operator'}
              </button>
            </div>
            {showForm === 'operator' && (
              <form onSubmit={handleCreateOperator} className="form-block">
                <div className="form-grid">
                  <div className="filter-group">
                    <label className="filter-label">Name *</label>
                    <input name="name" className="filter-input" required placeholder="Operator name" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">Contact name</label>
                    <input name="contactName" className="filter-input" placeholder="Contact" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">Email</label>
                    <input name="email" type="email" className="filter-input" placeholder="email@example.com" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">Phone</label>
                    <input name="phone" className="filter-input" placeholder="Phone" />
                  </div>
                  <div className="filter-group span-2">
                    <label className="filter-label">Address</label>
                    <input name="address" className="filter-input" placeholder="Address" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">Tax ID</label>
                    <input name="taxId" className="filter-input" placeholder="Tax ID" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">Bank name</label>
                    <input name="bankName" className="filter-input" placeholder="Bank" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">Bank account</label>
                    <input name="bankAccount" className="filter-input" placeholder="Account" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">Bank branch</label>
                    <input name="bankBranch" className="filter-input" placeholder="Branch" />
                  </div>
                </div>
                {submitError && <p className="login-error">{submitError}</p>}
                <button type="submit" disabled={submitting} className="btn btn-primary">Save operator</button>
              </form>
            )}
          </section>
          <section className="panel">
            <h3 className="panel-title">Operators</h3>
            <p className="page-subtitle page-subtitle--spaced">
              Registered operators for assignments, trips, and payouts.
            </p>
            {operators.length === 0 && !showForm ? (
              <div className="empty-state">
                <p className="empty-state-message">No operators yet.</p>
                <div className="empty-state-action">
                  <button type="button" className="btn btn-primary" onClick={() => setShowForm('operator')}>
                    Add operator
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operators.length === 0 ? (
                      <tr><td colSpan={5} className="table-empty">No operators yet. Add one above.</td></tr>
                    ) : (
                      operators.map((op) => (
                        <tr key={op.id}>
                          <td>{op.name}</td>
                          <td>{op.contactName ?? '—'}</td>
                          <td>{op.email ?? '—'}</td>
                          <td>{op.phone ?? '—'}</td>
                          <td><FleetStatusChip status={op.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'drivers' && (
        <>
          <section className="panel">
            <div className="panel-header-row">
              <h3 className="panel-title">Add driver</h3>
              <button
                type="button"
                className={showForm === 'driver' ? 'btn btn-secondary' : 'btn btn-primary'}
                onClick={() => setShowForm(showForm === 'driver' ? null : 'driver')}
              >
                {showForm === 'driver' ? 'Cancel' : 'Add driver'}
              </button>
            </div>
            {showForm === 'driver' && (
              <form onSubmit={handleCreateDriver} className="form-block">
                <div className="form-grid">
                  <div className="filter-group">
                    <label className="filter-label">First name *</label>
                    <input name="firstName" className="filter-input" required placeholder="First" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">Last name *</label>
                    <input name="lastName" className="filter-input" required placeholder="Last" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">Phone</label>
                    <input name="phone" className="filter-input" placeholder="Phone" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">Email</label>
                    <input name="email" type="email" className="filter-input" placeholder="email@example.com" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">License number</label>
                    <input name="licenseNumber" className="filter-input" placeholder="License" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">Operator (optional)</label>
                    <select name="operatorId" className="filter-select">
                      <option value="">— None —</option>
                      {operators.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {submitError && <p className="login-error">{submitError}</p>}
                <button type="submit" disabled={submitting} className="btn btn-primary">Save driver</button>
              </form>
            )}
          </section>
          <section className="panel">
            <h3 className="panel-title">Drivers</h3>
            <p className="page-subtitle page-subtitle--spaced">
              Drivers can be linked to an operator when created.
            </p>
            {drivers.length === 0 && !showForm ? (
              <div className="empty-state">
                <p className="empty-state-message">No drivers yet.</p>
                <div className="empty-state-action">
                  <button type="button" className="btn btn-primary" onClick={() => setShowForm('driver')}>
                    Add driver
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Operator</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.length === 0 ? (
                      <tr><td colSpan={4} className="table-empty">No drivers yet. Add one above.</td></tr>
                    ) : (
                      drivers.map((d) => (
                        <tr key={d.id}>
                          <td>{d.firstName} {d.lastName}</td>
                          <td>{d.phone ?? '—'}</td>
                          <td>{d.assignments?.[0]?.operator?.name ?? '—'}</td>
                          <td><FleetStatusChip status={d.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'vehicles' && (
        <>
          <section className="panel">
            <div className="panel-header-row">
              <h3 className="panel-title">Add vehicle</h3>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowForm(showForm === 'vehicle' ? null : 'vehicle')}
              >
                {showForm === 'vehicle' ? 'Cancel' : 'Add vehicle'}
              </button>
            </div>
            {showForm === 'vehicle' && (
              <form onSubmit={handleCreateVehicle} className="form-block">
                <div className="form-grid">
                  <div className="filter-group">
                    <label className="filter-label">Plate number *</label>
                    <input name="plateNumber" className="filter-input" required placeholder="ABC 1234" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">Vehicle type *</label>
                    <input name="vehicleType" className="filter-input" required placeholder="e.g. 4W, 6W" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">Body type</label>
                    <input name="bodyType" className="filter-input" placeholder="e.g. Van" />
                  </div>
                  <div className="filter-group">
                    <label className="filter-label">Operator (optional)</label>
                    <select name="operatorId" className="filter-select">
                      <option value="">— None —</option>
                      {operators.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {submitError && <p className="login-error">{submitError}</p>}
                <button type="submit" disabled={submitting} className="btn btn-primary">Save vehicle</button>
              </form>
            )}
          </section>
          <section className="panel">
            <h3 className="panel-title">Vehicles</h3>
            <p className="page-subtitle page-subtitle--spaced">
              Fleet units; optional operator assignment on create.
            </p>
            {vehicles.length === 0 && !showForm ? (
              <div className="empty-state">
                <p className="empty-state-message">No vehicles yet.</p>
                <div className="empty-state-action">
                  <button type="button" className="btn btn-primary" onClick={() => setShowForm('vehicle')}>
                    Add vehicle
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Plate</th>
                      <th>Type</th>
                      <th>Body</th>
                      <th>Operator</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.length === 0 ? (
                      <tr><td colSpan={5} className="table-empty">No vehicles yet. Add one above.</td></tr>
                    ) : (
                      vehicles.map((v) => (
                        <tr key={v.id}>
                          <td>{v.plateNumber}</td>
                          <td>{v.vehicleType}</td>
                          <td>{v.bodyType ?? '—'}</td>
                          <td>{v.assignments?.[0]?.operator?.name ?? '—'}</td>
                          <td><FleetStatusChip status={v.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
