'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { inviteTeamMember } from '@/lib/actions/team';

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'team_member'>('team_member');
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    const result = await inviteTeamMember({ email, role });
    setSending(false);

    if (!result.success) {
      toast('error', result.error ?? 'Failed to send invitation');
    } else {
      toast('success', `Invitation sent to ${email}`);
      setEmail('');
      setRole('team_member');
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@company.com"
          required
        />
      </div>
      <div className="w-44">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Role
        </label>
        <Select value={role} onValueChange={(val) => setRole(val as 'admin' | 'team_member')}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="team_member">Team Member</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={sending}>
        {sending ? 'Sending...' : 'Send Invitation'}
      </Button>
    </form>
  );
}
