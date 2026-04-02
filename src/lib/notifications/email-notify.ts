import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
import { createElement } from 'react';
import { Html, Body, Container, Section, Text, Heading, Hr, Button } from '@react-email/components';

// Roles that get email notifications for everything
const NOTIFY_ALL_ROLES: ('owner' | 'admin')[] = ['owner', 'admin'];

interface EmailNotifyOptions {
  subject: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
  // If set, also email this specific user (e.g. the assigned team member)
  alsoNotifyUserId?: string;
  // User who triggered the action — don't email them about their own action
  excludeUserId?: string;
}

function NotificationEmail({ body, actionUrl, actionLabel }: { body: string; actionUrl?: string; actionLabel?: string }) {
  return createElement(Html, null,
    createElement(Body, { style: { backgroundColor: '#f5f5f5', fontFamily: 'Inter, -apple-system, sans-serif', margin: '0', padding: '40px 0' } },
      createElement(Container, { style: { backgroundColor: '#ffffff', border: '1px solid #e5e5e5', margin: '0 auto', maxWidth: '560px' } },
        createElement(Section, { style: { padding: '32px' } },
          createElement(Heading, { style: { color: '#141414', fontSize: '18px', fontWeight: '600', margin: '0 0 16px' } }, 'AushCRM Notification'),
          createElement(Hr, { style: { borderColor: '#e5e5e5', margin: '16px 0' } }),
          createElement(Text, { style: { color: '#404040', fontSize: '14px', lineHeight: '24px', margin: '0 0 16px' } }, body),
          actionUrl ? createElement(Section, { style: { marginTop: '24px' } },
            createElement(Button, {
              href: actionUrl,
              style: { backgroundColor: '#141414', color: '#ffffff', display: 'inline-block', fontSize: '14px', fontWeight: '500', padding: '12px 24px', textDecoration: 'none' }
            }, actionLabel || 'View in Dashboard')
          ) : null,
          createElement(Text, { style: { color: '#a0a0a0', fontSize: '12px', marginTop: '24px' } }, 'You received this because you are a member of AushCRM.')
        )
      )
    )
  );
}

export async function emailNotify(options: EmailNotifyOptions) {
  try {
    const supabase = createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aushcrm.com';

    // Get all admin + owner emails
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', NOTIFY_ALL_ROLES);

    const userIdsToEmail = new Set<string>();

    // Admins and owners get everything
    if (adminRoles) {
      for (const r of adminRoles) {
        if (r.user_id !== options.excludeUserId) {
          userIdsToEmail.add(r.user_id);
        }
      }
    }

    // Also notify specific user (team member assigned, requester, etc.)
    if (options.alsoNotifyUserId && options.alsoNotifyUserId !== options.excludeUserId) {
      userIdsToEmail.add(options.alsoNotifyUserId);
    }

    if (userIdsToEmail.size === 0) return;

    // Get emails for all users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', Array.from(userIdsToEmail));

    if (!profiles || profiles.length === 0) return;

    const fullActionUrl = options.actionUrl ? `${appUrl}${options.actionUrl}` : undefined;

    // Send emails (don't await all — fire and forget per email, but await the batch)
    await Promise.allSettled(
      profiles.map((p) =>
        sendEmail(
          p.email,
          options.subject,
          NotificationEmail({ body: options.body, actionUrl: fullActionUrl, actionLabel: options.actionLabel })
        )
      )
    );
  } catch (err) {
    console.error('[EmailNotify] Failed:', err);
  }
}
