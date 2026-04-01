import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { StatusRequest } from '@/types';

export async function getPendingRequests(): Promise<StatusRequest[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('status_requests')
    .select(
      '*, requester:profiles!requester_id(id, full_name, avatar_url, email, created_at, updated_at), lead:leads!lead_id(id, name, email, business_name)'
    )
    .is('decision', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as StatusRequest[];
}

export async function getUserRequests(userId: string): Promise<StatusRequest[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('status_requests')
    .select(
      '*, requester:profiles!requester_id(id, full_name, avatar_url, email, created_at, updated_at), decider:profiles!decided_by(id, full_name, avatar_url, email, created_at, updated_at), lead:leads!lead_id(id, name, email, business_name)'
    )
    .eq('requester_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as StatusRequest[];
}
