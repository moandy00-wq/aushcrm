import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getKPIs,
  getLeadsByStage,
  getLeadsBySource,
  getTeamLeaderboard,
  getPendingRequestsCount,
  getMyLeadsCount,
  getMyPendingRequestsCount,
  getMyLatestLead,
  getMyLeads,
} from '@/lib/queries/analytics';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { StageChart, SourceChart } from '@/components/dashboard/analytics-charts';
import { TeamLeaderboard } from '@/components/dashboard/team-leaderboard';
import { STATUS_COLORS } from '@/lib/constants';
import type { AppRole, LeadStatus } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single();

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user!.id)
    .single();

  const role = (roleRow?.role as AppRole) ?? 'team_member';
  const name = profile?.full_name ?? 'there';
  const isAdminOrOwner = role === 'admin' || role === 'owner';

  if (isAdminOrOwner) {
    const [kpis, stageData, sourceData, leaderboard, pendingRequests] =
      await Promise.all([
        getKPIs(),
        getLeadsByStage(),
        getLeadsBySource(),
        getTeamLeaderboard(),
        getPendingRequestsCount(),
      ]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {name}
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Total Leads" value={kpis.totalLeads} />
          <KpiCard label="New This Week" value={kpis.newThisWeek} />
          <KpiCard
            label="Conversion Rate"
            value={`${kpis.conversionRate}%`}
            subtitle={`Avg ${kpis.avgDaysToClose} days to close`}
          />
          <KpiCard label="Pending Requests" value={pendingRequests} />
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <StageChart data={stageData} />
          <SourceChart data={sourceData} />
        </div>

        {/* Leaderboard */}
        <TeamLeaderboard entries={leaderboard} />
      </div>
    );
  }

  // Team member view
  const [myLeads, myPending, latestLead, myLeadsList] = await Promise.all([
    getMyLeadsCount(user!.id),
    getMyPendingRequestsCount(user!.id),
    getMyLatestLead(user!.id),
    getMyLeads(user!.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {name}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="My Leads" value={myLeads} />
        <KpiCard label="Pending Requests" value={myPending} />
        <KpiCard
          label="Latest Lead"
          value={latestLead ?? 'None'}
        />
      </div>

      {/* My leads table */}
      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">My Assigned Leads</h3>
        </div>
        {myLeadsList.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            No leads assigned to you yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-2 font-medium text-gray-500">Name</th>
                <th className="px-4 py-2 font-medium text-gray-500">Email</th>
                <th className="px-4 py-2 font-medium text-gray-500">Business</th>
                <th className="px-4 py-2 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {myLeadsList.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2 text-gray-900">
                    <a
                      href={`/leads/${lead.id}`}
                      className="hover:underline"
                    >
                      {lead.name}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{lead.email}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {lead.business_name || '-'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[lead.status as LeadStatus] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {lead.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
