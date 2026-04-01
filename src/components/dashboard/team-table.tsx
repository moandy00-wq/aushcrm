'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { changeTeamMemberRole, removeTeamMember } from '@/lib/actions/team';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';
import type { UserWithRole, AppRole } from '@/types';

interface TeamTableProps {
  members: UserWithRole[];
  currentUserId: string;
}

export function TeamTable({ members, currentUserId }: TeamTableProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const user = useUser();
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [loadingRemove, setLoadingRemove] = useState<string | null>(null);

  async function handleRoleChange(userId: string, newRole: string) {
    setLoadingRole(userId);
    const result = await changeTeamMemberRole(userId, newRole as AppRole);
    setLoadingRole(null);

    if (!result.success) {
      toast('error', result.error ?? 'Failed to change role');
    } else {
      toast('success', 'Role updated successfully');
      router.refresh();
    }
  }

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from the team? This action cannot be undone.`)) {
      return;
    }

    setLoadingRemove(userId);
    const result = await removeTeamMember(userId);
    setLoadingRemove(null);

    if (!result.success) {
      toast('error', result.error ?? 'Failed to remove member');
    } else {
      toast('success', 'Team member removed');
      router.refresh();
    }
  }

  return (
    <table className="w-full text-sm">
      <thead className="border-b border-gray-200">
        <tr>
          <th className="h-10 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Name
          </th>
          <th className="h-10 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Email
          </th>
          <th className="h-10 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Role
          </th>
          <th className="h-10 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Joined
          </th>
          <th className="h-10 px-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {members.map((member) => {
          const isCurrentUser = member.id === currentUserId;
          const isOwner = member.role === 'owner';

          return (
            <tr
              key={member.id}
              className="border-b border-gray-100 last:border-0"
            >
              <td className="px-3 py-3 text-gray-900 font-medium">
                {member.full_name}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-gray-400">(you)</span>
                )}
              </td>
              <td className="px-3 py-3 text-gray-700">{member.email}</td>
              <td className="px-3 py-3">
                {isOwner || isCurrentUser ? (
                  <Badge
                    className={ROLE_COLORS[member.role]}
                  >
                    {ROLE_LABELS[member.role]}
                  </Badge>
                ) : (
                  <Select
                    value={member.role}
                    onValueChange={(val) => handleRoleChange(member.id, val)}
                    disabled={loadingRole === member.id}
                  >
                    <SelectTrigger className="h-8 w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="team_member">Team Member</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </td>
              <td className="px-3 py-3 text-gray-500">
                {new Date(member.created_at).toLocaleDateString()}
              </td>
              <td className="px-3 py-3 text-right">
                {!isCurrentUser && !isOwner && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemove(member.id, member.full_name)}
                    disabled={loadingRemove === member.id}
                  >
                    {loadingRemove === member.id ? 'Removing...' : 'Remove'}
                  </Button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
