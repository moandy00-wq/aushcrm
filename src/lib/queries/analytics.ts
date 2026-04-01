import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { LeadStatus } from '@/types';

export interface KPIs {
  totalLeads: number;
  newThisWeek: number;
  conversionRate: number;
  avgDaysToClose: number;
}

export interface LeadsByStage {
  status: LeadStatus;
  count: number;
}

export interface LeadsBySource {
  source: string;
  count: number;
}

export interface TeamLeaderboardEntry {
  name: string;
  total: number;
  converted: number;
}

export async function getKPIs(): Promise<KPIs> {
  const supabase = await createServerSupabaseClient();

  // Total active leads (not deleted)
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  // New this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { count: newThisWeek } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('created_at', oneWeekAgo.toISOString());

  // Conversion rate
  const { count: activeClients } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('status', 'active_client');

  const total = totalLeads ?? 0;
  const conversionRate = total > 0 ? ((activeClients ?? 0) / total) * 100 : 0;

  // Avg days to close — leads that reached active_client
  const { data: closedLeads } = await supabase
    .from('leads')
    .select('created_at, stage_entered_at')
    .is('deleted_at', null)
    .eq('status', 'active_client');

  let avgDaysToClose = 0;
  if (closedLeads && closedLeads.length > 0) {
    const totalDays = closedLeads.reduce((sum, lead) => {
      const created = new Date(lead.created_at).getTime();
      const closed = new Date(lead.stage_entered_at).getTime();
      return sum + (closed - created) / (1000 * 60 * 60 * 24);
    }, 0);
    avgDaysToClose = Math.round(totalDays / closedLeads.length);
  }

  return {
    totalLeads: total,
    newThisWeek: newThisWeek ?? 0,
    conversionRate: Math.round(conversionRate * 10) / 10,
    avgDaysToClose,
  };
}

export async function getLeadsByStage(): Promise<LeadsByStage[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('leads')
    .select('status')
    .is('deleted_at', null);

  if (error) throw new Error(error.message);

  // Group by status manually (Supabase JS doesn't support GROUP BY)
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] || 0) + 1;
  }

  return Object.entries(counts).map(([status, count]) => ({
    status: status as LeadStatus,
    count,
  }));
}

export async function getLeadsBySource(): Promise<LeadsBySource[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('leads')
    .select('source')
    .is('deleted_at', null);

  if (error) throw new Error(error.message);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const source = row.source || 'Unknown';
    counts[source] = (counts[source] || 0) + 1;
  }

  return Object.entries(counts).map(([source, count]) => ({
    source,
    count,
  }));
}

export async function getTeamLeaderboard(): Promise<TeamLeaderboardEntry[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('leads')
    .select('assigned_to, status, assigned_profile:profiles!assigned_to(full_name)')
    .is('deleted_at', null)
    .not('assigned_to', 'is', null);

  if (error) throw new Error(error.message);

  const map: Record<string, { name: string; total: number; converted: number }> = {};
  for (const row of data ?? []) {
    const id = row.assigned_to as string;
    const profile = row.assigned_profile as { full_name: string } | null;
    if (!map[id]) {
      map[id] = {
        name: profile?.full_name ?? 'Unknown',
        total: 0,
        converted: 0,
      };
    }
    map[id].total++;
    if (row.status === 'active_client') {
      map[id].converted++;
    }
  }

  return Object.values(map).sort((a, b) => b.converted - a.converted);
}

export async function getPendingRequestsCount(): Promise<number> {
  const supabase = await createServerSupabaseClient();

  const { count, error } = await supabase
    .from('status_requests')
    .select('*', { count: 'exact', head: true })
    .is('decision', null);

  if (error) throw new Error(error.message);

  return count ?? 0;
}

export async function getMyLeadsCount(userId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();

  const { count, error } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('assigned_to', userId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getMyPendingRequestsCount(userId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();

  const { count, error } = await supabase
    .from('status_requests')
    .select('*', { count: 'exact', head: true })
    .eq('requester_id', userId)
    .is('decision', null);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getMyLatestLead(userId: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('leads')
    .select('name')
    .is('deleted_at', null)
    .eq('assigned_to', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data?.name ?? null;
}

export async function getMyLeads(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('leads')
    .select('id, name, email, business_name, status, created_at')
    .is('deleted_at', null)
    .eq('assigned_to', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw new Error(error.message);
  return data ?? [];
}
