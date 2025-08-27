import React from 'react';
import { cn } from '@bermuda/ui/lib/cn';

export type GddModel = 'gdd0' | 'gdd10';

export interface PgrGaugeProps {
  current: number; // GDD units (C-degree-days)
  target: number; // GDD units target for reset
  model: GddModel;
  className?: string;
}

export function gaugeZone(percent: number): 'calm' | 'amber' | 'red' {
  if (percent <= 80) return 'calm';
  if (percent <= 100) return 'amber';
  return 'red';
}

export default function PgrGauge({ current, target, model, className }: PgrGaugeProps) {
  const pct = Math.max(0, Math.min(200, (current / Math.max(target, 0.0001)) * 100));
  const angle = Math.min(100, pct) * 3.6; // cap ring at 100%
  const zone = gaugeZone(pct);
  const color = zone === 'calm' ? '#22c55e' : zone === 'amber' ? '#f59e0b' : '#ef4444';

  const ringBg = `conic-gradient(${color} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg)`;
  const aria = `PGR Gauge: ${pct.toFixed(0)}% of target, zone ${zone}.`;

  return (
    <div className={cn('grid place-items-center', className)} aria-label={aria} role="img">
      <div
        className="relative"
        style={{ width: 180, height: 180 }}
      >
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: ringBg }}
        />
        {/* Inner circle with darker background */}
        <div 
          className="absolute inset-2 rounded-full" 
          style={{ backgroundColor: 'rgb(15, 20, 30)' }}
        />
        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-6xl font-black" style={{ color: color, fontVariantNumeric: 'tabular-nums' }}>
            {current.toFixed(0)}
          </div>
          <div className="text-xs font-medium mt-1" style={{ color: 'rgb(148, 163, 184)' }}>/ {target} {model.toUpperCase()}</div>
          {pct > 100 && (
            <div className="mt-3 px-3 py-1 rounded text-xs font-bold" style={{ backgroundColor: color, color: 'black' }}>REAPPLY</div>
          )}
        </div>
      </div>
    </div>
  );
}

