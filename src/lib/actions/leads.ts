'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateLeadStatusSchema, assignLeadSchema, moveLeadInPipelineSchema } from '@/types/schemas';
import { createNotification } from '@/lib/notifications/create';
import { emailNotify } from '@/lib/notifications/email-notify';
import type { ActionResult } from '@/types';

export async function updateLeadStatus(
  data: unknown
): Promise<ActionResult> {
  try {
    const parsed = updateLeadStatusSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createServerSupabaseClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get lead to check assigned_to
    const { data: lead } = await supabase
      .from('leads')
      .select('id, name, assigned_to')
      .eq('id', parsed.data.lead_id)
      .single();

    const { error } = await supabase
      .from('leads')
      .update({
        status: parsed.data.status,
        stage_entered_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.lead_id);

    if (error) {
      return { success: false, error: error.message };
    }

    // In-app notification for assigned team member
    if (lead?.assigned_to && lead.assigned_to !== userData.user.id) {
      await createNotification(
        lead.assigned_to,
        'lead_status_changed',
        'Lead status changed',
        `"${lead.name}" moved to ${parsed.data.status}`,
        `/leads/${parsed.data.lead_id}`
      );
    }

    // Email notification — admins/owner get all, assigned team member gets theirs
    await emailNotify({
      subject: `Lead status changed: ${lead?.name ?? 'Unknown'}`,
      body: `The lead "${lead?.name}" has been moved to "${parsed.data.status.replace(/_/g, ' ')}".`,
      actionUrl: `/leads/${parsed.data.lead_id}`,
      alsoNotifyUserId: lead?.assigned_to ?? undefined,
      excludeUserId: userData.user.id,
    });

    revalidatePath('/leads');
    revalidatePath('/pipeline');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update lead status' };
  }
}

export async function assignLead(
  data: unknown
): Promise<ActionResult> {
  try {
    const parsed = assignLeadSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createServerSupabaseClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get lead name for notification
    const { data: lead } = await supabase
      .from('leads')
      .select('id, name')
      .eq('id', parsed.data.lead_id)
      .single();

    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: parsed.data.assigned_to })
      .eq('id', parsed.data.lead_id);

    if (error) {
      return { success: false, error: error.message };
    }

    // In-app notification for assigned user
    if (parsed.data.assigned_to && parsed.data.assigned_to !== userData.user.id) {
      await createNotification(
        parsed.data.assigned_to,
        'lead_assigned',
        'Lead assigned to you',
        `You have been assigned "${lead?.name ?? 'a lead'}"`,
        `/leads/${parsed.data.lead_id}`
      );
    }

    // Email notification — admins/owner get all, assigned team member gets theirs
    if (parsed.data.assigned_to) {
      await emailNotify({
        subject: `Lead assigned: ${lead?.name ?? 'Unknown'}`,
        body: `The lead "${lead?.name}" has been assigned to a team member.`,
        actionUrl: `/leads/${parsed.data.lead_id}`,
        alsoNotifyUserId: parsed.data.assigned_to,
        excludeUserId: userData.user.id,
      });
    }

    revalidatePath('/leads');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to assign lead' };
  }
}

export async function softDeleteLead(
  leadId: string
): Promise<ActionResult> {
  try {
    if (!leadId) {
      return { success: false, error: 'Lead ID is required' };
    }

    const supabase = await createServerSupabaseClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('leads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/leads');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete lead' };
  }
}

export async function moveLeadInPipeline(
  data: unknown
): Promise<ActionResult> {
  try {
    const parsed = moveLeadInPipelineSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createServerSupabaseClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('leads')
      .update({
        status: parsed.data.status,
        position: parsed.data.position,
        stage_entered_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.lead_id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/pipeline');
    revalidatePath('/leads');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to move lead in pipeline' };
  }
}
