import * as React from 'react';

export const IconSize = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

type SizeKey = keyof typeof IconSize;

interface IconProps extends React.SVGAttributes<SVGElement> {
  size?: SizeKey | number;
}

function sz(size?: SizeKey | number) {
  if (!size) return IconSize.md;
  if (typeof size === 'number') return size;
  return IconSize[size] ?? IconSize.md;
}

export function LawnLeaf({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 21s3-2 6-2 6 2 6 2" opacity="0.4" />
      <path d="M12 4C7 9 6 13 6 16s2 5 6 5 6-2 6-5-1-7-6-12Z" />
      <path d="M12 9v8" />
    </svg>
  );
}

export function Wind({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 8h10a3 3 0 1 0-3-3" />
      <path d="M3 16h13a2 2 0 1 1-2 2" />
      <path d="M3 12h7" opacity="0.7" />
    </svg>
  );
}

export function Droplet({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11Z" />
    </svg>
  );
}

export function Thermometer({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 14.76V5a2 2 0 1 0-4 0v9.76a4 4 0 1 0 4 0Z" />
    </svg>
  );
}

export function Gauge({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 20a9 9 0 1 1 10 0" />
      <path d="M12 13l3-3" />
    </svg>
  );
}

export function Beaker({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 2h4" />
      <path d="M8 2h8v4l4 10a4 4 0 0 1-4 6H8a4 4 0 0 1-4-6l4-10V2Z" />
    </svg>
  );
}

export function MapPin({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21s7-5 7-11a7 7 0 1 0-14 0c0 6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function AlertTriangle({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10.3 3.9 1.8 18.1A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function Layers({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" opacity="0.6" />
    </svg>
  );
}

export function Settings({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M20.46 20.46l-4.24-4.24M4.24 16.22l-4.24 4.24M23 12h-6m-6 0H1" />
    </svg>
  );
}

export function X({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function Plus({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14m7-7H5" />
    </svg>
  );
}

export function Trash2({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6m4-6v6" />
    </svg>
  );
}

export function Save({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}

export function Spinner({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function Calendar({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function ShoppingCart({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export function Clock({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function RefreshCw({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export function User({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function UserPlus({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

export function LogOut({ size, ...props }: IconProps) {
  const s = sz(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export const Icons = {
  LawnLeaf,
  Wind,
  Droplet,
  Thermometer,
  Gauge,
  Beaker,
  MapPin,
  AlertTriangle,
  Layers,
  Settings,
  X,
  Plus,
  Trash2,
  Save,
  Spinner,
  Calendar,
  ShoppingCart,
  Clock,
  RefreshCw,
  User,
  UserPlus,
  LogOut,
};

export default Icons;

