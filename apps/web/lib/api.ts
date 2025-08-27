export function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (base) return base;
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:8000';
  throw new Error('NEXT_PUBLIC_API_BASE is required in production');
}

export function apiUrl(path: string): string {
  const base = apiBase();
  if (path.startsWith('http')) return path;
  return `${base}${path}`;
}

