"use client";
import { useEffect, useState } from 'react';
import { apiUrl } from '../../lib/api';
import { Chip, Badge } from '@bermuda/ui';

export default function AlertsBanner() {
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('pending');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(apiUrl('/api/weather/summary?lat=32.78&lon=-96.80'));
        const data = await res.json();
        setCount((data?.alerts?.items || []).length);
        setStatus(data?.alerts?.status || 'unknown');
      } catch (e) {
        setStatus('error');
      }
    };
    load();
  }, []);

  if (status === 'pending') return null;
  const unavailable = status !== 'ok';

  return (
    <div className="flex items-center gap-3">
      <Badge className="bg-surface2 border-border/50">NWS</Badge>
      {unavailable ? (
        <Chip>Alerts unavailable</Chip>
      ) : (
        <Chip>{count} active alerts</Chip>
      )}
    </div>
  );
}
