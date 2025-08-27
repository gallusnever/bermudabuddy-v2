"use client";
import * as React from 'react';
import { cn } from '../lib/cn';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Drawer({ open, onClose, children, title }: DrawerProps) {
  return (
    <div
      aria-hidden={!open}
      className={cn(
        'fixed inset-0 z-50 transition-opacity',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute right-0 top-0 h-full w-full max-w-md bb-card p-6 transform transition-transform',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {title ? <h2 className="text-xl font-semibold mb-4">{title}</h2> : null}
        <div className="overflow-auto h-full pr-2">{children}</div>
      </div>
    </div>
  );
}

export default Drawer;
