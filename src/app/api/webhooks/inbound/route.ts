import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

interface InboundEmail {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as InboundEmail;
    const { from, to, subject, text, html } = payload;

    // Extract lead ID from the "to" address: reply+{leadId}@aushcrm.com
    const toMatch = to.match(/reply\+([a-f0-9-]+)@/i);
    if (!toMatch) {
      console.log('[Inbound] No lead ID in to address:', to);
      return NextResponse.json({ received: true, matched: false });
    }

    const leadId = toMatch[1];
    const body = text || html || '';
    const fromEmail = from.match(/<(.+?)>/)?.[1] || from;

    const supabase = createAdminClient();

    // Verify the lead exists
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, name')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      console.log('[Inbound] Lead not found for ID:', leadId);
      return NextResponse.json({ received: true, matched: false });
    }

    // Store as inbound email
    const { error: insertError } = await supabase.from('lead_emails').insert({
      lead_id: leadId,
      sender_id: null,
      to_email: to,
      from_email: fromEmail,
      subject: subject || '(no subject)',
      body,
      status: 'delivered',
      direction: 'inbound',
    });

    if (insertError) {
      console.error('[Inbound] Failed to store email:', insertError);
      return NextResponse.json({ error: 'Failed to store' }, { status: 500 });
    }

    // Notify admins about the reply
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['owner', 'admin']);

    if (adminRoles) {
      const now = new Date().toISOString();
      const notifications = adminRoles.map((r) => ({
        user_id: r.user_id,
        type: 'new_lead' as const,
        title: `Reply from ${lead.name}`,
        body: subject || 'New email reply received',
        link: `/leads/${leadId}`,
        created_at: now,
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json({ received: true, matched: true, leadId });
  } catch (err) {
    console.error('[Inbound] Error:', err);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
