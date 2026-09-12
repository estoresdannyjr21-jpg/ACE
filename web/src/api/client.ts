const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export function getAuthToken(): string | null {
  return import.meta.env.VITE_AUTH_TOKEN ?? sessionStorage.getItem('auth_token');
}

export function setAuthToken(token: string) {
  sessionStorage.setItem('auth_token', token);
}

export function clearAuthToken() {
  sessionStorage.removeItem('auth_token');
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email: string, password: string): Promise<{ access_token: string; user?: { id: string; email: string; firstName: string; lastName: string; role: string; tenantId: string } }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Login failed: ${res.status}`);
  }
  return res.json();
}

export type ProfileResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  tenant: { id: string; name: string } | null;
};

export async function fetchProfile(): Promise<ProfileResponse> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Profile failed: ${res.status}`);
  return res.json();
}

export type SearchResult = {
  trips: Array<{ id: string; internalRef: string; runsheetDate?: string }>;
  drivers: Array<{ id: string; firstName: string; lastName: string }>;
  operators: Array<{ id: string; name: string }>;
};

export async function searchGlobal(q: string): Promise<SearchResult> {
  const res = await fetch(`${API_BASE}/dispatch/search?q=${encodeURIComponent(q)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}

// ——— Notifications ———

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  status: string;
  readAt: string | null;
  createdAt: string;
};

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch(`${API_BASE}/notifications`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Notifications failed: ${res.status}`);
  return res.json();
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Mark read failed: ${res.status}`);
}

export async function fetchFinanceLookups() {
  const res = await fetch(`${API_BASE}/finance/lookups`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Lookups failed: ${res.status}`);
  return res.json();
}

export async function fetchFinanceDashboard(params: Record<string, string | undefined> = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') q.set(k, v);
  });
  const url = `${API_BASE}/finance/dashboard${q.toString() ? `?${q}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Dashboard failed: ${res.status} ${res.statusText}`);
  return res.json();
}

// ——— AR/AP Ledger reports ———

export type ArLedgerRow = {
  tripFinanceId: string;
  tripId: string;
  internalRef: string;
  runsheetDate: string;
  clientAccountId?: string;
  clientAccountName?: string;
  serviceCategoryName?: string;
  billingStatus: string;
  billingLedgerDate: string | null;
  amount: number;
  agingBucket: string;
};

export type AgingBucket = { bucket: string; amount: number; count: number };

export type ArLedgerResponse = {
  ledger: ArLedgerRow[];
  aging: AgingBucket[];
  totalReceivable: number;
  totalCount: number;
};

export type ArLedgerParams = {
  clientAccountId?: string;
  serviceCategoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
};

export async function fetchArLedger(params: ArLedgerParams = {}): Promise<ArLedgerResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '' && (typeof v !== 'number' || !Number.isNaN(v))) q.set(k, String(v));
  });
  const url = `${API_BASE}/finance/reports/ar-ledger${q.toString() ? `?${q}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`AR ledger failed: ${res.status}`);
  return res.json();
}

export type ApLedgerRow = {
  tripFinanceId: string;
  tripId: string;
  internalRef: string;
  runsheetDate: string;
  operatorId?: string;
  operatorName?: string;
  clientAccountName?: string;
  serviceCategoryName?: string;
  payoutStatus: string;
  payoutDueDate: string | null;
  amount: number;
  agingBucket: string;
};

export type ApLedgerResponse = {
  ledger: ApLedgerRow[];
  aging: AgingBucket[];
  totalPayable: number;
  totalCount: number;
};

export type ApLedgerParams = {
  operatorId?: string;
  clientAccountId?: string;
  serviceCategoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
};

export async function fetchApLedger(params: ApLedgerParams = {}): Promise<ApLedgerResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '' && (typeof v !== 'number' || !Number.isNaN(v))) q.set(k, String(v));
  });
  const url = `${API_BASE}/finance/reports/ap-ledger${q.toString() ? `?${q}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`AP ledger failed: ${res.status}`);
  return res.json();
}

export type FinanceDashboardResponse = {
  counts: {
    podVerifiedNotReceived: number;
    docReceivedNotComputed: number;
    billingReadyToBill: number;
    billingBilled: number;
    billingPaid: number;
    payoutReadyForPayout: number;
    payoutInBatch: number;
    payoutFinMgrApproved: number;
    payoutCfoApproved: number;
    payoutReleased: number;
    payoutPaid: number;
    reimbursablesPendingApproval: number;
    reimbursablesApprovedPendingBatch: number;
    subconExpiringSoon: number;
    subconExpiredBlocked: number;
    overridesPendingCfo: number;
  };
  podVerifiedNotReceivedList: Array<{
    id: string;
    internalRef: string;
    runsheetDate: string;
    podStatus: string;
    assignedDriver?: { id: string; firstName: string; lastName: string };
  }>;
  docReceivedNotComputedList: Array<{
    id: string;
    internalRef: string;
    runsheetDate: string;
    finance?: { id: string; financeDocReceivedAt: string | null };
    assignedDriver?: { id: string; firstName: string; lastName: string };
  }>;
  overridesPendingList: Array<{
    id: string;
    status: string;
    trip: { id: string; internalRef: string; runsheetDate: string };
  }>;
};

export async function fetchDispatchLookups() {
  const res = await fetch(`${API_BASE}/dispatch/lookups`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Dispatch lookups failed: ${res.status}`);
  return res.json();
}

export async function fetchOperationsDashboard(params: Record<string, string | undefined> = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') q.set(k, v);
  });
  const url = `${API_BASE}/dispatch/dashboard/operations${q.toString() ? `?${q}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Operations dashboard failed: ${res.status}`);
  return res.json();
}

export type OperationsDashboardResponse = {
  counts: {
    pendingAcceptance: number;
    acceptedOngoing: number;
    completed: number;
    podUploadedPendingReview: number;
    podRejected: number;
    podVerified: number;
    financeDocReceived: number;
    noUpdateCallTime: number;
  };
  pendingAcceptanceTrips: Array<{
    id: string;
    internalRef: string;
    runsheetDate: string;
    callTime: string;
    assignmentStatus: string;
    highLevelTripStatus: string;
    podStatus: string;
    assignedDriver?: { id: string; firstName: string; lastName: string };
    serviceCategory?: { id: string; name: string; code: string };
  }>;
  noUpdateCallTimeTrips: Array<{
    id: string;
    internalRef: string;
    runsheetDate: string;
    callTime: string;
    lastDriverEventAt: string | null;
    assignedDriver?: { id: string; firstName: string; lastName: string };
    serviceCategory?: { id: string; name: string; code: string };
  }>;
  openIncidents: Array<{
    id: string;
    incidentType: string;
    severity: string;
    status: string;
    description: string | null;
    reportedAt: string;
    trip: { id: string; internalRef: string };
  }>;
};

// ——— Incidents ———

export type IncidentListItem = {
  id: string;
  tripId: string;
  incidentType: string;
  severity: string;
  status: string;
  description: string;
  reportedAt: string;
  trip: { id: string; internalRef: string; runsheetDate?: string };
  reporter?: { id: string; firstName: string; lastName: string };
};

export type PaginatedResult<T> = { items: T[]; totalCount: number };

export async function fetchIncidents(params: Record<string, string | undefined> = {}): Promise<PaginatedResult<IncidentListItem>> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.set(k, v); });
  const url = `${API_BASE}/incidents${q.toString() ? `?${q}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Incidents failed: ${res.status}`);
  const data = await res.json();
  if (!data || typeof data !== 'object' || !Array.isArray(data.items)) {
    throw new Error('Invalid incidents response');
  }
  return data as PaginatedResult<IncidentListItem>;
}

export async function fetchIncidentById(id: string) {
  const res = await fetch(`${API_BASE}/incidents/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Incident failed: ${res.status}`);
  return res.json();
}

export async function createIncident(body: { tripId: string; incidentType: string; severity: string; description: string; gpsLat?: number; gpsLng?: number; gpsAccuracy?: number }) {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Create incident failed: ${res.status}`));
  return res.json();
}

export async function resolveIncident(id: string, body: { resolutionNotes: string; replacementTripId?: string }) {
  const res = await fetch(`${API_BASE}/incidents/${id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Resolve failed: ${res.status}`));
  return res.json();
}

export async function closeIncident(id: string) {
  const res = await fetch(`${API_BASE}/incidents/${id}/close`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Close failed: ${res.status}`));
  return res.json();
}

export async function addIncidentUpdate(id: string, body: { newStatus?: string; comment?: string }) {
  const res = await fetch(`${API_BASE}/incidents/${id}/updates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Add update failed: ${res.status}`));
  return res.json();
}

export async function addIncidentMedia(id: string, fileKey: string) {
  const res = await fetch(`${API_BASE}/incidents/${id}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ fileKey }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Add media failed: ${res.status}`));
  return res.json();
}

/** Upload a file; returns { fileKey }. type: 'incident' | 'pod' | 'reimbursable' | 'event-media' | 'general' */
export async function uploadFile(file: File, type: string = 'general'): Promise<{ fileKey: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/upload?type=${encodeURIComponent(type)}`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Upload failed: ${res.status}`));
  return res.json();
}

// Fleet Acquisition
export async function getOperators() {
  const res = await fetch(`${API_BASE}/fleet-acquisition/operators`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Operators failed: ${res.status}`);
  return res.json();
}

export async function getDrivers() {
  const res = await fetch(`${API_BASE}/fleet-acquisition/drivers`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Drivers failed: ${res.status}`);
  return res.json();
}

export async function getVehicles() {
  const res = await fetch(`${API_BASE}/fleet-acquisition/vehicles`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Vehicles failed: ${res.status}`);
  return res.json();
}

export async function createOperator(body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/fleet-acquisition/operators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Create operator failed: ${res.status}`));
  return res.json();
}

export async function createDriver(body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/fleet-acquisition/drivers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Create driver failed: ${res.status}`));
  return res.json();
}

export async function createVehicle(body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/fleet-acquisition/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Create vehicle failed: ${res.status}`));
  return res.json();
}

// Dispatch - Trips (paginated when `limit` is sent; totalCount is always returned)
export type TripListItem = {
  id: string;
  internalRef: string;
  runsheetDate: string;
  callTime: string;
  assignmentStatus: string;
  highLevelTripStatus: string;
  podStatus: string;
  originArea: string;
  destinationArea: string;
  vehicleType: string;
  assignedDriver?: { id: string; firstName: string; lastName: string };
  assignedVehicle?: { id: string; plateNumber: string; vehicleType: string };
  serviceCategory?: { id: string; name: string; code: string };
  clientAccount?: { id: string; name: string; code: string };
};

export async function getTrips(params: Record<string, string | undefined> = {}): Promise<PaginatedResult<TripListItem>> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.set(k, v); });
  const url = `${API_BASE}/dispatch/trips${q.toString() ? `?${q}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Trips failed: ${res.status}`);
  const data = await res.json();
  if (!data || typeof data !== 'object' || !Array.isArray(data.items)) {
    throw new Error('Invalid trips response');
  }
  return data as PaginatedResult<TripListItem>;
}

export async function createTrip(body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/dispatch/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Create trip failed: ${res.status}`));
  return res.json();
}

// ——— Finance AR Batches ———

export type ArBatchListItem = {
  id: string;
  clientAccountId: string;
  serviceSegment: string;
  cutoffStartDate: string;
  cutoffEndDate: string;
  status: string;
  reverseBillingReceivedAt: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  paymentListReceivedAt: string | null;
  amountPaidFromClient: unknown;
  checkPickupDate: string | null;
  depositedAt: string | null;
  clientAccount: { id: string; name: string; code: string };
  _count: { trips: number; unmatchedLines: number };
};

export async function getArBatches(params: Record<string, string | undefined> = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.set(k, v); });
  const url = `${API_BASE}/finance/ar/batches${q.toString() ? `?${q}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`AR batches failed: ${res.status}`);
  return res.json() as Promise<ArBatchListItem[]>;
}

export type ArBatchDetail = ArBatchListItem & {
  trips: Array<{
    trip: {
      id: string;
      internalRef: string;
      clientTripRef: string | null;
      externalRef: string | null;
      runsheetDate: string;
      serviceCategory: { id: string; code: string; name: string } | null;
      finance: unknown;
    };
  }>;
  unmatchedLines: Array<{
    id: string;
    clientProvidedRef: string;
    ourInternalRef: string | null;
    serviceCategoryCode: string | null;
    runsheetDate: string | null;
    amountClient: unknown;
    notes: string | null;
  }>;
};

export async function getArBatchById(id: string) {
  const res = await fetch(`${API_BASE}/finance/ar/batches/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`AR batch failed: ${res.status}`);
  return res.json() as Promise<ArBatchDetail>;
}

export async function attachInvoiceToArBatch(batchId: string, dto: { invoiceNumber: string; invoiceDate: string }) {
  const res = await fetch(`${API_BASE}/finance/ar/batches/${batchId}/attach-invoice`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Attach invoice failed: ${res.status}`));
  return res.json() as Promise<ArBatchDetail>;
}

export async function markArBatchDeposited(batchId: string) {
  const res = await fetch(`${API_BASE}/finance/ar/batches/${batchId}/deposited`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Mark deposited failed: ${res.status}`));
  return res.json() as Promise<ArBatchDetail>;
}

export type ReverseBillingImportResult = {
  mode: 'preview' | 'commit';
  matched?: number;
  disputes?: number;
  unmatched?: number;
  errors?: Array<{ row?: number; message: string }>;
  unmatchedRows?: Array<Record<string, unknown>>;
};

export async function importReverseBillingCsv(
  file: File,
  params: {
    commit: boolean;
    client_code: string;
    service_segment: string;
    cutoff_start_date: string;
    cutoff_end_date: string;
  }
): Promise<ReverseBillingImportResult> {
  const form = new FormData();
  form.append('file', file);
  const url = new URL(`${API_BASE}/finance/ar/reverse-billing/import`);
  url.searchParams.set('commit', String(params.commit));
  url.searchParams.set('client_code', params.client_code);
  url.searchParams.set('service_segment', params.service_segment);
  url.searchParams.set('cutoff_start_date', params.cutoff_start_date);
  url.searchParams.set('cutoff_end_date', params.cutoff_end_date);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Import failed: ${res.status}`));
  return res.json();
}

export type PaymentListImportResult = {
  mode: 'preview' | 'commit';
  updated?: number;
  notFound?: string[];
  errors?: Array<{ message: string }>;
};

export async function importPaymentListCsv(
  file: File,
  params: {
    commit: boolean;
    client_code: string;
    payment_list_received_date: string;
  }
): Promise<PaymentListImportResult> {
  const form = new FormData();
  form.append('file', file);
  const url = new URL(`${API_BASE}/finance/ar/payment-list/import`);
  url.searchParams.set('commit', String(params.commit));
  url.searchParams.set('client_code', params.client_code);
  url.searchParams.set('payment_list_received_date', params.payment_list_received_date);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Import failed: ${res.status}`));
  return res.json();
}

// ——— Rates (lookups + wetlease config) ———

export type RatesLookups = {
  clients: Array<{
    id: string;
    name: string;
    code: string;
    serviceSegments: Array<{ id: string; name: string; code: string }>;
    serviceCategories: Array<{
      id: string;
      name: string;
      code: string;
      serviceSegmentId: string;
      firstTripOnlyPayout: boolean;
      serviceSegment?: { id: string; name: string; code: string };
    }>;
  }>;
};

export async function fetchRatesLookups(): Promise<RatesLookups> {
  const res = await fetch(`${API_BASE}/rates/lookups`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Rates lookups failed: ${res.status}`);
  return res.json();
}

export type WetleaseFirstTripRateRow = {
  id: string;
  clientAccountId: string;
  serviceCategoryId: string;
  firstTripClientBillAmount: number | null;
  firstTripPayoutVatable: number;
  effectiveStart: string;
  effectiveEnd: string | null;
  clientAccount?: { id: string; name: string; code: string };
  serviceCategory?: { id: string; name: string; code: string };
};

export async function listWetleaseFirstTripRates(params: {
  clientAccountId?: string;
  serviceCategoryId?: string;
} = {}): Promise<WetleaseFirstTripRateRow[]> {
  const q = new URLSearchParams();
  if (params.clientAccountId) q.set('clientAccountId', params.clientAccountId);
  if (params.serviceCategoryId) q.set('serviceCategoryId', params.serviceCategoryId);
  const url = `${API_BASE}/rates/wetlease-first-trip${q.toString() ? `?${q}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => `Wetlease rates failed: ${res.status}`));
  return res.json();
}

export async function createWetleaseFirstTripRate(body: {
  clientAccountId: string;
  serviceCategoryId: string;
  firstTripClientBillAmount: number;
  firstTripPayoutVatable: number;
  effectiveStart: string;
  effectiveEnd?: string;
}): Promise<WetleaseFirstTripRateRow> {
  const res = await fetch(`${API_BASE}/rates/wetlease-first-trip`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Create wetlease rate failed: ${res.status}`));
  return res.json();
}

export async function updateWetleaseFirstTripRate(
  id: string,
  body: Partial<{
    firstTripClientBillAmount: number;
    firstTripPayoutVatable: number;
    effectiveStart: string;
    effectiveEnd: string;
  }>,
): Promise<WetleaseFirstTripRateRow> {
  const res = await fetch(`${API_BASE}/rates/wetlease-first-trip/${id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Update wetlease rate failed: ${res.status}`));
  return res.json();
}

// ——— Master data (Client → ServiceSegment → ServiceCategory) ———

/** Nest returns `{ message }` as a string, or an array for validation errors. */
async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    const msg = (data as { message?: string | string[] })?.message;
    if (Array.isArray(msg)) return msg.join('; ');
    if (typeof msg === 'string' && msg) return msg;
  } catch {
    // response had no JSON body
  }
  return `${fallback}: ${res.status}`;
}

/** Prisma Decimal fields arrive as strings over JSON. */
export type DecimalString = string | number;

export type MasterDataCategory = {
  id: string;
  clientAccountId: string;
  serviceSegmentId: string;
  name: string;
  code: string;
  status: string;
  payoutTermsBusinessDays: number;
  docSubmissionDay: string;
  cycleStartDay: string;
  excludeWeekends: boolean;
  subcontractorInvoiceDeadlineDays: number;
  callTimeGraceMinutes: number;
  vatRate: DecimalString;
  adminFeePercent: DecimalString;
  withholdingPercent: DecimalString;
  firstTripOnlyPayout: boolean;
  serviceSegment?: { id: string; name: string; code: string };
};

export type MasterDataSegment = {
  id: string;
  clientAccountId: string;
  name: string;
  code: string;
  sortOrder: number;
  status: string;
  serviceCategories?: MasterDataCategory[];
};

export type MasterDataTripRequirement = {
  id: string;
  code: string;
  label: string;
  kind: 'DOCUMENT' | 'FIELD';
  docType: string | null;
  serviceCategoryId: string | null;
  required: boolean;
  sortOrder: number;
  status: string;
  helpText: string | null;
  serviceCategory?: { id: string; name: string; code: string } | null;
};

export type MasterDataClient = {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  status: string;
  createdAt: string;
  serviceSegments?: MasterDataSegment[];
  tripRequirements?: MasterDataTripRequirement[];
  _count?: { tripRequirements: number; trips: number; routeRates: number };
};

export async function listMasterDataClients(includeInactive = false): Promise<MasterDataClient[]> {
  const q = includeInactive ? '?includeInactive=true' : '';
  const res = await fetch(`${API_BASE}/master-data/clients${q}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await readApiError(res, 'Failed to load clients'));
  return res.json();
}

export async function getMasterDataClient(clientId: string): Promise<MasterDataClient> {
  const res = await fetch(`${API_BASE}/master-data/clients/${clientId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await readApiError(res, 'Failed to load client'));
  return res.json();
}

export async function createMasterDataClient(body: {
  name: string;
  code: string;
  status?: string;
}): Promise<MasterDataClient> {
  const res = await fetch(`${API_BASE}/master-data/clients`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res, 'Create client failed'));
  return res.json();
}

export async function updateMasterDataClient(
  clientId: string,
  body: { name?: string; status?: string },
): Promise<MasterDataClient> {
  const res = await fetch(`${API_BASE}/master-data/clients/${clientId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res, 'Update client failed'));
  return res.json();
}

export async function listServiceSegments(clientId: string): Promise<MasterDataSegment[]> {
  const res = await fetch(`${API_BASE}/master-data/clients/${clientId}/segments`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await readApiError(res, 'Failed to load segments'));
  return res.json();
}

export async function createServiceSegment(
  clientId: string,
  body: { name: string; code: string; sortOrder?: number; status?: string },
): Promise<MasterDataSegment> {
  const res = await fetch(`${API_BASE}/master-data/clients/${clientId}/segments`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res, 'Create segment failed'));
  return res.json();
}

export async function updateServiceSegment(
  segmentId: string,
  body: { name?: string; sortOrder?: number; status?: string },
): Promise<MasterDataSegment> {
  const res = await fetch(`${API_BASE}/master-data/segments/${segmentId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res, 'Update segment failed'));
  return res.json();
}

/** Payout terms + financial rules configured per service category. */
export type ServiceCategoryRules = {
  payoutTermsBusinessDays?: number;
  docSubmissionDay?: string;
  cycleStartDay?: string;
  excludeWeekends?: boolean;
  subcontractorInvoiceDeadlineDays?: number;
  callTimeGraceMinutes?: number;
  vatRate?: number;
  adminFeePercent?: number;
  withholdingPercent?: number;
  firstTripOnlyPayout?: boolean;
};

export async function listServiceCategories(clientId: string): Promise<MasterDataCategory[]> {
  const res = await fetch(`${API_BASE}/master-data/clients/${clientId}/categories`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await readApiError(res, 'Failed to load categories'));
  return res.json();
}

export async function createServiceCategory(
  clientId: string,
  body: ServiceCategoryRules & {
    serviceSegmentId: string;
    name: string;
    code: string;
    status?: string;
  },
): Promise<MasterDataCategory> {
  const res = await fetch(`${API_BASE}/master-data/clients/${clientId}/categories`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res, 'Create category failed'));
  return res.json();
}

export async function updateServiceCategory(
  categoryId: string,
  body: ServiceCategoryRules & { serviceSegmentId?: string; name?: string; status?: string },
): Promise<MasterDataCategory> {
  const res = await fetch(`${API_BASE}/master-data/categories/${categoryId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res, 'Update category failed'));
  return res.json();
}

// ——— Rates CSV Import ———

export type RatesImportResult = {
  mode: 'preview' | 'commit';
  importMode: 'create' | 'update' | 'upsert';
  totalRows: number;
  validRows: number;
  created: number;
  updated: number;
  errors: Array<{ rowNumber: number; message: string }>;
};

export async function importRatesCsv(
  file: File,
  params: { commit: boolean; mode: 'create' | 'update' | 'upsert' }
): Promise<RatesImportResult> {
  const form = new FormData();
  form.append('file', file);
  const url = new URL(`${API_BASE}/rates/import`);
  url.searchParams.set('commit', String(params.commit));
  url.searchParams.set('mode', params.mode);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `Rates import failed: ${res.status}`));
  return res.json();
}
