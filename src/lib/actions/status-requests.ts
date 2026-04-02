'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createStatusRequestSchema, decideStatusRequestSchema } from '@/types/schemas';
import { createNotification, notifyAdmins } from '@/lib/notifications/create';
import { emailNotify } from '@/lib/notifications/email-notify';
import type { ActionResult } from '@/types';

export async function createStatusRequest(
  data: unknown
): Promise<ActionResult> {
  try {
    const parsed = createStatusRequestSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createServerSupabaseClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get current lead status
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, name, status')
      .eq('id', parsed.data.lead_id)
      .single();

    if (leadError || !lead) {
      return { success: false, error: 'Lead not found' };
    }

    const { error } = await supabase.from('status_requests').insert({
      lead_id: parsed.data.lead_id,
      requester_id: userData.user.id,
      current_status: lead.status,
      requested_status: parsed.data.requested_status,
      note: parsed.data.note,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // In-app notify admins
    await notifyAdmins(
      'request_submitted',
      'New Status Change Request',
      `Request to move "${lead.name}" from ${lead.status} to ${parsed.data.requested_status}`,
      '/requests'
    );

    // Email admins/owner
    await emailNotify({
      subject: `Status change request: ${lead.name}`,
      body: `A team member has requested to move "${lead.name}" from "${lead.status.replace(/_/g, ' ')}" to "${parsed.data.requested_status.replace(/_/g, ' ')}".`,
      actionUrl: '/requests',
      actionLabel: 'Review Request',
      excludeUserId: userData.user.id,
    });

    revalidatePath('/requests');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to create status request' };
  }
}

export async function decideStatusRequest(
  data: unknown
): Promise<ActionResult> {
  try {
    const parsed = decideStatusRequestSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createServerSupabaseClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Fetch the request
    const { data: request, error: reqError } = await supabase
      .from('status_requests')
      .select('id, lead_id, requester_id, current_status, requested_status, decision')
      .eq('id', parsed.data.request_id)
      .single();

    if (reqError || !request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.decision !== null) {
      return { success: false, error: 'This request has already been decided' };
    }

    // Check for stale request — compare current_status with actual lead status
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, name, status')
      .eq('id', request.lead_id)
      .single();

    if (leadError || !lead) {
      return { success: false, error: 'Lead not found' };
    }

    if (lead.status !== request.current_status) {
      // Mark as denied due to stale status
      await supabase
        .from('status_requests')
        .update({
          decision: 'denied',
          decided_by: userData.user.id,
          decided_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      return {
        success: false,
        error: 'Lead status has changed since this request was made. Request auto-denied.',
      };
    }

    // If approved, update lead status
    if (parsed.data.decision === 'approved') {
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          status: request.requested_status,
          stage_entered_at: new Date().toISOString(),
        })
        .eq('id', request.lead_id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    }

    // Update request decision
    const { error: decisionError } = await supabase
      .from('status_requests')
      .update({
        decision: parsed.data.decision,
        decision_note: parsed.data.decision_note || null,
        decided_by: userData.user.id,
        decided_at: new Date().toISOString(),
      })
      .eq('id', request.id);

    if (decisionError) {
      return { success: false, error: decisionError.message };
    }

    // In-app notify requester
    await createNotification(
      request.requester_id,
      'request_decided',
      `Status request ${parsed.data.decision}`,
      `Your request to move "${lead.name}" was ${parsed.data.decision}`,
      `/leads/${request.lead_id}`
    );

    // Email requester + admins/owner
    const noteText = parsed.data.decision_note ? `\n\nNote: "${parsed.data.decision_note}"` : '';
    await emailNotify({
      subject: `Status request ${parsed.data.decision}: ${lead.name}`,
      body: `The request to move "${lead.name}" to "${request.requested_status.replace(/_/g, ' ')}" has been ${parsed.data.decision}.${noteText}`,
      actionUrl: `/leads/${request.lead_id}`,
      alsoNotifyUserId: request.requester_id,
      excludeUserId: userData.user.id,
    });

    revalidatePath('/requests');
    revalidatePath('/leads');
    revalidatePath('/pipeline');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to decide status request' };
  }
}
