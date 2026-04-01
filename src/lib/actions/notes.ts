'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createNoteSchema } from '@/types/schemas';
import type { ActionResult, LeadNote } from '@/types';

export async function createNote(
  data: unknown
): Promise<ActionResult<LeadNote>> {
  try {
    const parsed = createNoteSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createServerSupabaseClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: note, error } = await supabase
      .from('lead_notes')
      .insert({
        lead_id: parsed.data.lead_id,
        content: parsed.data.content,
        author_id: userData.user.id,
      })
      .select('*, author:profiles!author_id(id, full_name, avatar_url, email, created_at, updated_at)')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/leads');
    return { success: true, data: note as unknown as LeadNote };
  } catch {
    return { success: false, error: 'Failed to create note' };
  }
}

export async function deleteNote(
  noteId: string
): Promise<ActionResult> {
  try {
    if (!noteId) {
      return { success: false, error: 'Note ID is required' };
    }

    const supabase = await createServerSupabaseClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('lead_notes')
      .delete()
      .eq('id', noteId)
      .eq('author_id', userData.user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/leads');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete note' };
  }
}
