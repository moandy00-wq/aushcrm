import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTeamMembers, getInvitations } from '@/lib/queries/team';
import { TeamTable } from '@/components/dashboard/team-table';
import { InviteForm } from '@/components/dashboard/invite-form';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/lib/constants';
import type { AppRole, Invitation } from '@/types';

export const dynamic = 'force-dynamic';

function InvitationStatus({ invitation }: { invitation: Invitation }) {
  const isExpired = new Date(invitation.expires_at) < new Date();
  const isAccepted = !!invitation.accepted_at;

  if (isAccepted) {
    return <Badge variant="success">Accepted</Badge>;
  }
  if (isExpired) {
    return <Badge variant="destructive">Expired</Badge>;
  }
  return <Badge variant="warning">Pending</Badge>;
}

export default async function TeamPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!userRole || userRole.role !== 'owner') {
    redirect('/dashboard');
  }

  const [members, invitations] = await Promise.all([
    getTeamMembers(),
    getInvitations(),
  ]);

  // Filter pending invitations: not accepted and not expired
  const pendingInvitations = invitations.filter(
    (inv) => !inv.accepted_at && new Date(inv.expires_at) >= new Date()
  );

  // Show all invitations for the table (including expired/accepted for history)
  const recentInvitations = invitations.slice(0, 20);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage your team members and send invitations.
      </p>

      {/* Invite Form */}
      <div className="mt-8">
        <h2 className="text-base font-semibold text-gray-900">
          Invite a Team Member
        </h2>
        <div className="mt-4 border border-gray-200 p-6">
          <InviteForm />
        </div>
      </div>

      {/* Team Members */}
      <div className="mt-10">
        <h2 className="text-base font-semibold text-gray-900">
          Team Members
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({members.length})
          </span>
        </h2>
        <div className="mt-4 border border-gray-200">
          <TeamTable members={members} currentUserId={user.id} />
        </div>
      </div>

      {/* Pending Invitations */}
      {recentInvitations.length > 0 && (
        <div className="mt-10">
          <h2 className="text-base font-semibold text-gray-900">
            Invitations
            {pendingInvitations.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({pendingInvitations.length} pending)
              </span>
            )}
          </h2>
          <div className="mt-4 border border-gray-200">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="h-10 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="h-10 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="h-10 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="h-10 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentInvitations.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-3 py-3 text-gray-700">{inv.email}</td>
                    <td className="px-3 py-3 text-gray-700">
                      {ROLE_LABELS[inv.role as AppRole]}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">
                      <InvitationStatus invitation={inv} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
