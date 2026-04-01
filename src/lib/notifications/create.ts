import { createAdminClient } from '@/lib/supabase/admin';
import type { NotificationType } from '@/types';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    link,
  });

  if (error) {
    console.error('[Notification] Failed to create notification:', error);
  }
}

export async function notifyAdmins(
  type: NotificationType,
  title: string,
  body: string,
  link: string
): Promise<void> {
  const supabase = createAdminClient();

  const { data: adminRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('role', ['owner', 'admin']);

  if (!adminRoles || adminRoles.length === 0) return;

  for (const { user_id } of adminRoles) {
    await createNotification(user_id, type, title, body, link);
  }
}
