"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Icons } from '@bermuda/ui';
import Link from 'next/link';
import { useAuth } from '../../contexts/auth-context';

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFirstName((profile as any).first_name || '');
      setLastName((profile as any).last_name || '');
      setNickname((profile as any).nickname || '');
    }
  }, [profile]);

  async function onSave() {
    if (!user) return;
    setSaving(true);
    setSaved(null);
    const { error } = await updateProfile({
      first_name: firstName || null,
      last_name: lastName || null,
      nickname: nickname || null,
    } as any);
    setSaving(false);
    setSaved(error ? 'Error saving profile' : 'Saved');
  }

  if (!user) {
    return (
      <main className="container mx-auto max-w-3xl px-6 py-10">
        <Card className="bb-clay">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Icons.User /> Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted mb-4">Sign in to edit your profile.</p>
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
          <CardTitle className="flex items-center gap-2"><Icons.User /> Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">First Name</label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" />
            </div>
            <div>
              <label className="text-sm">Last Name</label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Nickname</label>
              <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="FungusFrank" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save Profile'}</Button>
            {saved && <span className="text-sm text-muted">{saved}</span>}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

