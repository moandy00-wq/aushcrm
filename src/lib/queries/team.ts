import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { UserWithRole, Invitation } from '@/types';

export async function getTeamMembers(): Promise<UserWithRole[]> {
  const supabase = await createServerSupabaseClient();

  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('role, user_id, profile:profiles!user_id(id, email, full_name, avatar_url, created_at, updated_at)');

  if (error) {
    throw new Error(error.message);
  }

  if (!roles) return [];

  return roles.map((r: Record<string, unknown>) => {
    const profile = r.profile as Record<string, unknown>;
    return {
      id: profile.id as string,
      email: profile.email as string,
      full_name: profile.full_name as string,
      avatar_url: profile.avatar_url as string | null,
      created_at: profile.created_at as string,
      updated_at: profile.updated_at as string,
      role: r.role as UserWithRole['role'],
    };
  });
}

export async function getInvitations(): Promise<Invitation[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Invitation[];
}
