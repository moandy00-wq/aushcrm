import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ActivityLogEntry, PaginatedResult, PaginationParams } from '@/types';

export async function getLeadActivity(
  leadId: string,
  pagination?: PaginationParams
): Promise<PaginatedResult<ActivityLogEntry>> {
  const supabase = await createServerSupabaseClient();
  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? 25;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from('activity_log')
    .select(
      '*, user:profiles!user_id(id, full_name, avatar_url, email, created_at, updated_at)',
      { count: 'exact' }
    )
    .eq('entity_type', 'lead')
    .eq('entity_id', leadId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;

  return {
    data: (data ?? []) as unknown as ActivityLogEntry[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getRecentActivity(
  pagination?: PaginationParams
): Promise<PaginatedResult<ActivityLogEntry>> {
  const supabase = await createServerSupabaseClient();
  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? 25;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from('activity_log')
    .select(
      '*, user:profiles!user_id(id, full_name, avatar_url, email, created_at, updated_at)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;

  return {
    data: (data ?? []) as unknown as ActivityLogEntry[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
