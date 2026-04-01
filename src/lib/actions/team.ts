'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createInvitationSchema } from '@/types/schemas';
import { sendEmail } from '@/lib/email/send';
import { TeamInvitationEmail } from '@/lib/email/templates/team-invitation';
import { ROLE_LABELS } from '@/lib/constants';
import type { ActionResult, AppRole } from '@/types';
import crypto from 'crypto';

async function requireOwner() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated', supabase, userId: '' };
  }

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!userRole || userRole.role !== 'owner') {
    return { error: 'Only the owner can perform this action', supabase, userId: user.id };
  }

  return { error: null, supabase, userId: user.id };
}

export async function inviteTeamMember(
  data: unknown
): Promise<ActionResult<{ email: string }>> {
  try {
    const parsed = createInvitationSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { error: authError, supabase, userId } = await requireOwner();
    if (authError) {
      return { success: false, error: authError };
    }

    const { email, role } = parsed.data;

    // Revoke any existing unexpired invitation for this email
    await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString());

    // Create new invitation
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: insertError } = await supabase.from('invitations').insert({
      email,
      role,
      invited_by: userId,
      token,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${token}`;
    await sendEmail(
      email,
      'You\'re invited to AushCRM',
      TeamInvitationEmail({ role: ROLE_LABELS[role as AppRole], inviteUrl })
    );

    revalidatePath('/team');
    return { success: true, data: { email } };
  } catch {
    return { success: false, error: 'Failed to send invitation' };
  }
}

export async function changeTeamMemberRole(
  userId: string,
  newRole: AppRole
): Promise<ActionResult> {
  try {
    const { error: authError, supabase, userId: ownerId } = await requireOwner();
    if (authError) {
      return { success: false, error: authError };
    }

    if (userId === ownerId) {
      return { success: false, error: 'You cannot change your own role' };
    }

    if (newRole === 'owner') {
      return { success: false, error: 'Cannot assign the owner role' };
    }

    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/team');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to change role' };
  }
}

export async function removeTeamMember(
  userId: string
): Promise<ActionResult> {
  try {
    const { error: authError, supabase, userId: ownerId } = await requireOwner();
    if (authError) {
      return { success: false, error: authError };
    }

    if (userId === ownerId) {
      return { success: false, error: 'You cannot remove yourself' };
    }

    // Delete user role
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Ban the user via admin client
    const adminSupabase = createAdminClient();
    const { error: banError } = await adminSupabase.auth.admin.updateUserById(
      userId,
      { ban_duration: '876000h' }
    );

    if (banError) {
      console.error('[Team] Failed to ban user:', banError);
    }

    revalidatePath('/team');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to remove team member' };
  }
}
