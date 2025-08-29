"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Icons, Chip } from '@bermuda/ui';
import Link from 'next/link';
import { useAuth } from '../../contexts/auth-context';

export default function SettingsPage() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    grass_type: '',
    hoc: '',
    mower: '',
    sprayer: '',
    irrigation: '',
    area_sqft: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        grass_type: (profile.grass_type as any) || '',
        hoc: profile.hoc != null ? String(profile.hoc) : '',
        mower: profile.mower || '',
        sprayer: (profile as any).sprayer || '',
        irrigation: profile.irrigation || '',
        area_sqft: profile.area_sqft != null ? String(profile.area_sqft) : '',
      });
    }
  }, [profile]);

  async function onSave() {
    if (!user) return;
    setSaving(true);
    setSaved(null);
    const payload: any = {
      grass_type: form.grass_type || null,
      hoc: form.hoc ? parseFloat(form.hoc) : null,
      mower: form.mower || null,
      irrigation: form.irrigation || null,
      area_sqft: form.area_sqft ? parseFloat(form.area_sqft) : null,
    };
    if (form.sprayer) payload.sprayer = form.sprayer;
    const { error } = await updateProfile(payload);
    
    if (!error) {
      // Refresh profile to update dashboard
      await refreshProfile();
      setSaved('Settings saved successfully!');
    } else {
      setSaved('Error saving settings');
    }
    setSaving(false);
  }

  if (!user) {
    return (
      <main className="container mx-auto max-w-3xl px-6 py-10">
        <Card className="bb-clay">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Icons.Settings /> Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted mb-4">Sign in to edit your settings.</p>
            <Link href="/login"><Button>Sign In</Button></Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-3xl px-6 py-10">
      <Card className="bb-clay">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Icons.Settings /> Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Grass Type</label>
              <Input value={form.grass_type} onChange={e => setForm(f => ({ ...f, grass_type: e.target.value }))} placeholder="bermuda, zoysia..." />
            </div>
            <div>
              <label className="text-sm">Height of Cut (in)</label>
              <Input value={form.hoc} onChange={e => setForm(f => ({ ...f, hoc: e.target.value }))} placeholder="0.75" />
            </div>
            <div>
              <label className="text-sm">Mower</label>
              <Input value={form.mower} onChange={e => setForm(f => ({ ...f, mower: e.target.value }))} placeholder="reel, rotary" />
            </div>
            <div>
              <label className="text-sm">Sprayer</label>
              <Input value={form.sprayer} onChange={e => setForm(f => ({ ...f, sprayer: e.target.value }))} placeholder="none, backpack, hose-end" />
            </div>
            <div>
              <label className="text-sm">Irrigation</label>
              <Input value={form.irrigation} onChange={e => setForm(f => ({ ...f, irrigation: e.target.value }))} placeholder="manual, automatic" />
            </div>
            <div>
              <label className="text-sm">Total Area (ft²)</label>
              <Input value={form.area_sqft} onChange={e => setForm(f => ({ ...f, area_sqft: e.target.value }))} placeholder="4500" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Button>
            {saved && <Chip>{saved}</Chip>}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

