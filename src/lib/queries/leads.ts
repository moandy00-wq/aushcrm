import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Lead, LeadEmail, LeadNote, PaginatedResult, PaginationParams, LeadStatus } from '@/types';

export interface LeadWithDuplicates extends Lead {
  duplicateCount?: number;
  duplicateIds?: string[];
}

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

  const leads = (data ?? []) as unknown as LeadWithDuplicates[];

  // Find duplicates by email within this result set + DB
  if (leads.length > 0) {
    const emails = leads.map((l) => l.email);
    const { data: dupes } = await supabase
      .from('leads')
      .select('id, email')
      .in('email', emails)
      .is('deleted_at', null);

    if (dupes) {
      const emailGroups: Record<string, string[]> = {};
      for (const d of dupes) {
        if (!emailGroups[d.email]) emailGroups[d.email] = [];
        emailGroups[d.email].push(d.id);
      }
      for (const lead of leads) {
        const group = emailGroups[lead.email];
        if (group && group.length > 1) {
          lead.duplicateCount = group.length - 1;
          lead.duplicateIds = group.filter((id) => id !== lead.id);
        }
      }
    }
  }

  return {
    data: leads,
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

export async function getLeadEmails(leadId: string): Promise<LeadEmail[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('lead_emails')
    .select(
      '*, sender:profiles!sender_id(id, full_name, avatar_url, email, created_at, updated_at)'
    )
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as LeadEmail[];
}

export async function getDuplicateLeads(
  email: string,
  excludeId: string
): Promise<{ id: string; name: string; status: string; created_at: string }[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('leads')
    .select('id, name, status, created_at')
    .eq('email', email)
    .neq('id', excludeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data ?? [];
}
