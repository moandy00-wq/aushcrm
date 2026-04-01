'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateLeadStatusSchema, assignLeadSchema } from '@/types/schemas';
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

    revalidatePath('/leads');
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

    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: parsed.data.assigned_to })
      .eq('id', parsed.data.lead_id);

    if (error) {
      return { success: false, error: error.message };
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
