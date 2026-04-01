'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types';

export async function markNotificationRead(
  notificationId: string
): Promise<ActionResult> {
  try {
    if (!notificationId) {
      return { success: false, error: 'Notification ID is required' };
    }

    const supabase = await createServerSupabaseClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userData.user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userData.user.id)
      .is('read_at', null);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to mark notifications as read' };
  }
}
