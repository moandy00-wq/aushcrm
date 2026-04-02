'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resend } from '@/lib/email/resend';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
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

export async function generateEmailDraft(
  leadId: string,
  context?: string
): Promise<ActionResult<{ subject: string; body: string }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify admin/owner role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'owner')) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch lead with relevant data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('name, email, status, interview_data')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return { success: false, error: 'Lead not found' };
    }

    // Fetch last 5 notes
    const { data: notes } = await supabase
      .from('lead_notes')
      .select('content, created_at')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Build prompt context
    const parts: string[] = [];
    parts.push(`Lead name: ${lead.name}`);
    parts.push(`Current pipeline status: ${lead.status}`);

    if (lead.interview_data) {
      const d = lead.interview_data as Record<string, unknown>;
      if (d.business_name) parts.push(`Business: ${d.business_name}`);
      if (d.industry) parts.push(`Industry: ${d.industry}`);
      if (d.business_model) parts.push(`Business model: ${d.business_model}`);
      if (d.team_size) parts.push(`Team size: ${d.team_size}`);
      if (d.pain_points) parts.push(`Pain points: ${Array.isArray(d.pain_points) ? d.pain_points.join(', ') : d.pain_points}`);
      if (d.current_tools) parts.push(`Current tools: ${d.current_tools}`);
      if (d.goals) parts.push(`Goals: ${d.goals}`);
    }

    if (notes && notes.length > 0) {
      parts.push(`Recent notes:\n${notes.map((n) => `- ${n.content}`).join('\n')}`);
    }

    if (context) {
      parts.push(`Additional context from user: ${context}`);
    }

    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: `You are writing a professional email on behalf of Aush, a company that provides custom CRM solutions. Write a concise, professional email to ${lead.name} based on the following lead information:

${parts.join('\n')}

Format your response exactly as:
Subject: <subject line here>

<email body here>

The email should be personalized to the lead's business and situation. Keep it concise and professional. Do not include any explanation outside the email format.`,
    });

    // Parse subject and body from response
    const subjectMatch = text.match(/^Subject:\s*(.+)/m);
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Follow up from Aush';

    // Body is everything after the Subject line and the blank line
    const bodyStart = text.indexOf('\n\n');
    const body = bodyStart !== -1 ? text.slice(bodyStart + 2).trim() : text.trim();

    return { success: true, data: { subject, body } };
  } catch (err) {
    console.error('[Email Draft] Failed to generate:', err);
    return { success: false, error: 'Failed to generate email draft' };
  }
}
