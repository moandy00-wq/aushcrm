import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPendingRequests, getUserRequests } from '@/lib/queries/status-requests';
import { StatusRequestCard } from '@/components/dashboard/status-request-card';
import type { AppRole } from '@/types';

export const dynamic = 'force-dynamic';

export default async function RequestsPage() {
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

  if (!userRole) {
    redirect('/auth/deactivated');
  }

  const role = userRole.role as AppRole;
  const isAdminOrOwner = role === 'owner' || role === 'admin';

  const requests = isAdminOrOwner
    ? await getPendingRequests()
    : await getUserRequests(user.id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {isAdminOrOwner ? 'Pending Requests' : 'My Requests'}
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        {isAdminOrOwner
          ? 'Review and decide on status change requests.'
          : 'Track your submitted status change requests.'}
      </p>

      {requests.length === 0 ? (
        <div className="border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No requests found.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {requests.map((request) => (
            <StatusRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
