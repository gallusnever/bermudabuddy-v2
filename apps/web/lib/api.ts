const RAW = process.env.NEXT_PUBLIC_API_BASE ?? '';

export function apiBase(): string {
  // In browser, use relative paths if no base configured (safer for prod)
  if (typeof window !== 'undefined' && !RAW) return '';
  // Otherwise use configured base or localhost for dev
  if (RAW) return RAW;
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:8000';
  return '';
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;  // absolute -> pass through
  if (typeof window !== 'undefined' && !RAW) return path;  // browser with no base -> relative
  const base = apiBase();
  return `${base}${path}`;  // server/build -> env base
}

