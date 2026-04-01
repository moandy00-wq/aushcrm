import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Lead, LeadNote, PaginatedResult, PaginationParams, LeadStatus } from '@/types';

export interface LeadFilters {
  status?: LeadStatus;
  search?: string;
}

export async function getLeads(
  filters?: LeadFilters,
  pagination?: PaginationParams
): Promise<PaginatedResult<Lead>> {
  const supabase = await createServerSupabaseClient();
  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? 25;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('leads')
    .select(
      '*, assigned_profile:profiles!assigned_to(id, full_name, avatar_url, email, created_at, updated_at)',
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    const search = `%${filters.search}%`;
    query = query.or(`name.ilike.${search},email.ilike.${search},business_name.ilike.${search}`);
  }

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;

  return {
    data: (data ?? []) as unknown as Lead[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getLead(id: string): Promise<Lead | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('leads')
    .select(
      '*, assigned_profile:profiles!assigned_to(id, full_name, avatar_url, email, created_at, updated_at)'
    )
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data as unknown as Lead;
}

export async function getLeadNotes(
  leadId: string,
  pagination?: PaginationParams
): Promise<PaginatedResult<LeadNote>> {
  const supabase = await createServerSupabaseClient();
  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? 25;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from('lead_notes')
    .select(
      '*, author:profiles!author_id(id, full_name, avatar_url, email, created_at, updated_at)',
      { count: 'exact' }
    )
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;

  return {
    data: (data ?? []) as unknown as LeadNote[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
