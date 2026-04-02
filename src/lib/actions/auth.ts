'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { acceptInviteSchema } from '@/types/schemas';
import type { ActionResult, Invitation } from '@/types';

export async function validateInviteToken(
  token: string
): Promise<ActionResult<{ email: string; role: string }>> {
  try {
    if (!token) {
      return { success: false, error: 'Token is required' };
    }

    const supabase = createAdminClient();

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return { success: false, error: 'Invalid invitation token' };
    }

    const inv = invitation as Invitation;

    if (inv.accepted_at) {
      return { success: false, error: 'This invitation has already been used' };
    }

    if (new Date(inv.expires_at) < new Date()) {
      return { success: false, error: 'This invitation has expired' };
    }

    return {
      success: true,
      data: { email: inv.email, role: inv.role },
    };
  } catch {
    return { success: false, error: 'Failed to validate invitation' };
  }
}

export async function acceptInvitation(
  data: unknown
): Promise<ActionResult<{ userId: string }>> {
  try {
    const parsed = acceptInviteSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { token, password, full_name } = parsed.data;

    const adminSupabase = createAdminClient();

    // Validate token
    const { data: invitation, error: fetchError } = await adminSupabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (fetchError || !invitation) {
      return { success: false, error: 'Invalid invitation token' };
    }

    const inv = invitation as Invitation;

    if (inv.accepted_at) {
      return { success: false, error: 'This invitation has already been used' };
    }

    if (new Date(inv.expires_at) < new Date()) {
      return { success: false, error: 'This invitation has expired' };
    }

    // Create user via admin client
    const { data: newUser, error: createError } =
      await adminSupabase.auth.admin.createUser({
        email: inv.email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

    if (createError) {
      return { success: false, error: createError.message };
    }

    if (!newUser.user) {
      return { success: false, error: 'Failed to create user' };
    }

    // The trigger auto-creates profile + team_member role.
    // Update role to match the invitation role if it differs from team_member.
    if (inv.role !== 'team_member') {
      const { error: roleError } = await adminSupabase
        .from('user_roles')
        .update({ role: inv.role })
        .eq('user_id', newUser.user.id);

      if (roleError) {
        console.error('[Auth] Failed to update role:', roleError);
      }
    }

    // Mark invitation as accepted
    const { error: updateError } = await adminSupabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', inv.id);

    if (updateError) {
      console.error('[Auth] Failed to mark invitation accepted:', updateError);
    }

    return { success: true, data: { userId: newUser.user.id } };
  } catch {
    return { success: false, error: 'Failed to accept invitation' };
  }
}
