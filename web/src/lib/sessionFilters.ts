/** Phase 3.5 — persist filter “Apply” state in sessionStorage (survives refresh, same tab). */

export function readSessionJson<T>(key: string): T | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeSessionJson(key: string, value: unknown): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export function clearSessionKey(key: string): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
