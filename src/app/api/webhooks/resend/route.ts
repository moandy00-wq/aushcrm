import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import type { LeadEmailStatus } from '@/types';

interface ResendWebhookEvent {
  type: string;
  data: {
    email_id: string;
    [key: string]: unknown;
  };
}

const EVENT_TO_STATUS: Record<string, LeadEmailStatus> = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
};

export async function POST(request: Request) {
  try {
    const event = (await request.json()) as ResendWebhookEvent;
    const newStatus = EVENT_TO_STATUS[event.type];

    if (!newStatus) {
      // Event type we don't care about — acknowledge it
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('lead_emails')
      .update({ status: newStatus })
      .eq('resend_id', event.data.email_id);

    if (error) {
      console.error('[Webhook] Failed to update email status:', error);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Webhook] Error processing event:', err);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
