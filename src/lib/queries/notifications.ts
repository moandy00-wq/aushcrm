import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Notification } from '@/types';

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('[Notifications] Failed to get unread count:', error);
    return 0;
  }

  return count ?? 0;
}

export async function getRecentNotifications(
  userId: string,
  limit = 20
): Promise<Notification[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Notifications] Failed to get recent notifications:', error);
    return [];
  }

  return (data ?? []) as unknown as Notification[];
}
