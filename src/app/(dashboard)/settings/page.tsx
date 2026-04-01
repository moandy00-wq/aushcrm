'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const user = useUser();
  const router = useRouter();
  const [fullName, setFullName] = useState(user.full_name);
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    setSaving(false);
    if (error) {
      toast('error', 'Failed to update profile.');
    } else {
      toast('success', 'Profile updated.');
      router.refresh();
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast('error', 'Password must be at least 8 characters.');
      return;
    }
    setChangingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setChangingPassword(false);
    if (error) {
      toast('error', error.message);
    } else {
      toast('success', 'Password updated.');
      setNewPassword('');
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage your account settings.
      </p>

      {/* Profile */}
      <form onSubmit={handleSaveProfile} className="mt-8">
        <h2 className="text-base font-semibold text-gray-900">Profile</h2>
        <div className="mt-4 space-y-4">
          <Input
            label="Email"
            type="email"
            value={user.email}
            disabled
          />
          <Input
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Password */}
      <form onSubmit={handleChangePassword} className="mt-10 border-t border-gray-200 pt-8">
        <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
        <div className="mt-4 space-y-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
          />
          <Button type="submit" disabled={changingPassword}>
            {changingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </form>
    </div>
  );
}
