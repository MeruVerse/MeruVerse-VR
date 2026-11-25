const STORAGE_KEY = 'meruverse:from-landing';

export interface PortalOrigin {
  readonly x: number;
  readonly y: number;
}

export function parseOrigin(raw: string | null): PortalOrigin | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const { fromLanding, x, y } = value as Record<string, unknown>;
    if (fromLanding !== true || typeof x !== 'number' || typeof y !== 'number') return null;
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
  } catch {
    return null;
  }
}

export function writeHandoff(origin: PortalOrigin): void {
  try {
    const payload = JSON.stringify({ fromLanding: true, x: origin.x, y: origin.y });
    sessionStorage.setItem(STORAGE_KEY, payload);
  } catch {
    return;
  }
}

export function readHandoff(): PortalOrigin | null {
  try {
    const origin = parseOrigin(sessionStorage.getItem(STORAGE_KEY));
    sessionStorage.removeItem(STORAGE_KEY);
    return origin;
  } catch {
    return null;
  }
}
