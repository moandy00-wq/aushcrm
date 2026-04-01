'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resend } from '@/lib/email/resend';
import { sendEmailSchema } from '@/types/schemas';
import type { ActionResult, LeadEmail } from '@/types';

export async function sendLeadEmail(
  data: unknown
): Promise<ActionResult<LeadEmail>> {
  try {
    const parsed = sendEmailSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createServerSupabaseClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get the lead to find their email
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('email, name')
      .eq('id', parsed.data.lead_id)
      .single();

    if (leadError || !lead) {
      return { success: false, error: 'Lead not found' };
    }

    // Send via Resend directly
    const { data: emailResult, error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'AushCRM <noreply@aush.com>',
      to: lead.email,
      subject: parsed.data.subject,
      text: parsed.data.body,
    });

    if (sendError) {
      console.error('[Email] Failed to send:', sendError);
      return { success: false, error: sendError.message };
    }

    // Insert lead_emails row
    const { data: emailRow, error: insertError } = await supabase
      .from('lead_emails')
      .insert({
        lead_id: parsed.data.lead_id,
        sender_id: userData.user.id,
        to_email: lead.email,
        subject: parsed.data.subject,
        body: parsed.data.body,
        resend_id: emailResult?.id ?? null,
        status: 'sent',
      })
      .select(
        '*, sender:profiles!sender_id(id, full_name, avatar_url, email, created_at, updated_at)'
      )
      .single();

    if (insertError) {
      console.error('[Email] Failed to insert record:', insertError);
      return { success: false, error: insertError.message };
    }

    revalidatePath('/leads');
    return { success: true, data: emailRow as unknown as LeadEmail };
  } catch {
    return { success: false, error: 'Failed to send email' };
  }
}
