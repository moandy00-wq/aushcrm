'use server';

import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email/send';
import { LeadConfirmationEmail } from '@/lib/email/templates/lead-confirmation';
import { NewLeadNotificationEmail } from '@/lib/email/templates/new-lead-notification';
import { interviewGateSchema, fallbackFormSchema } from '@/types/schemas';
import { extractInterviewData } from '@/lib/interview/extract';
import { generateLeadSummary } from '@/lib/interview/summarize';
import { notifyAdmins } from '@/lib/notifications/create';
import type { ActionResult, ChatMessage, InterviewSession } from '@/types';
import type { Json } from '@/types/database';
import { createElement } from 'react';

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for') ?? 'unknown';
}

export async function createPartialLead(
  name: string,
  email: string,
  website: string = ''
): Promise<ActionResult<InterviewSession>> {
  try {
    const ip = await getClientIp();
    const { success: withinLimit } = rateLimit(`interview:${ip}`, 5, 10 * 60 * 1000);
    if (!withinLimit) {
      return { success: false, error: 'Too many requests. Please try again later.' };
    }

    const parsed = interviewGateSchema.safeParse({ name, email, website });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const nonce = crypto.randomUUID();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        source: 'interview',
        is_complete: false,
        interview_nonce: nonce,
        interview_message_count: 0,
        status: 'new',
        position: 0,
        stage_entered_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('[Interview] Failed to create partial lead:', error);
      return { success: false, error: 'Failed to start interview. Please try again.' };
    }

    return { success: true, data: { leadId: data.id, nonce } };
  } catch (err) {
    console.error('[Interview] Unexpected error in createPartialLead:', err);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function completeInterview(
  leadId: string,
  nonce: string,
  messages: ChatMessage[]
): Promise<ActionResult> {
  try {
    const supabase = createAdminClient();

    // Validate lead exists, is incomplete, and nonce matches
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('id, name, email, is_complete, interview_nonce')
      .eq('id', leadId)
      .single();

    if (fetchError || !lead) {
      return { success: false, error: 'Interview session not found.' };
    }

    if (lead.is_complete) {
      return { success: false, error: 'This interview has already been completed.' };
    }

    if (lead.interview_nonce !== nonce) {
      return { success: false, error: 'Invalid session.' };
    }

    // Extract structured data from transcript
    const interviewData = await extractInterviewData(messages);

    // Update lead with extracted data
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        is_complete: true,
        interview_transcript: messages as unknown as Json,
        interview_data: interviewData as unknown as Json,
        business_name: interviewData.business_name || null,
        industry: interviewData.industry || null,
        team_size: interviewData.team_size || null,
        pain_points: interviewData.pain_points.length > 0 ? interviewData.pain_points : [],
        current_tools: interviewData.current_tools || null,
        goals: interviewData.goals || null,
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('[Interview] Failed to update lead:', updateError);
      return { success: false, error: 'Failed to save interview data.' };
    }

    // Generate AI summary (non-blocking)
    generateLeadSummary({
      name: lead.name,
      business_name: interviewData.business_name || null,
      interview_data: interviewData as unknown as Record<string, unknown>,
      interview_transcript: messages,
    }).then(async (summary) => {
      if (summary) {
        await supabase
          .from('leads')
          .update({ ai_summary: summary })
          .eq('id', leadId);
      }
    }).catch((err) => {
      console.error('[Interview] Failed to generate AI summary:', err);
    });

    // Send confirmation email to lead
    await sendEmail(
      lead.email,
      'Thanks for your interest in Aush',
      createElement(LeadConfirmationEmail, { name: lead.name })
    );

    // Send notification to admins
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['owner', 'admin']);

    if (adminRoles && adminRoles.length > 0) {
      const adminIds = adminRoles.map((r) => r.user_id);
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('email')
        .in('id', adminIds);

      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/leads`;

      if (adminProfiles) {
        for (const admin of adminProfiles) {
          await sendEmail(
            admin.email,
            `New Lead: ${lead.name}`,
            createElement(NewLeadNotificationEmail, {
              leadName: lead.name,
              leadEmail: lead.email,
              businessName: interviewData.business_name || 'Not provided',
              source: 'interview',
              dashboardUrl,
            })
          );
        }
      }
    }

    // In-app notification for admins
    await notifyAdmins(
      'new_lead',
      'New lead from interview',
      `${lead.name} completed an interview`,
      `/leads/${leadId}`
    );

    return { success: true };
  } catch (err) {
    console.error('[Interview] Unexpected error in completeInterview:', err);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function submitFallbackForm(
  data: Record<string, string>
): Promise<ActionResult> {
  try {
    const ip = await getClientIp();
    const { success: withinLimit } = rateLimit(`form:${ip}`, 5, 10 * 60 * 1000);
    if (!withinLimit) {
      return { success: false, error: 'Too many requests. Please try again later.' };
    }

    const parsed = fallbackFormSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = createAdminClient();

    const painPointsArray = parsed.data.pain_points
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean);

    const formInterviewData = {
      business_name: parsed.data.business_name,
      industry: parsed.data.industry,
      business_model: '',
      team_size: parsed.data.team_size,
      pain_points: painPointsArray,
      current_tools: parsed.data.current_tools || '',
      goals: parsed.data.goals,
      referral_source: parsed.data.referral_source || '',
      additional_notes: '',
    };

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        business_name: parsed.data.business_name,
        industry: parsed.data.industry,
        team_size: parsed.data.team_size,
        pain_points: painPointsArray,
        current_tools: parsed.data.current_tools || null,
        goals: parsed.data.goals,
        source: 'form',
        is_complete: true,
        status: 'new',
        position: 0,
        stage_entered_at: new Date().toISOString(),
        interview_data: formInterviewData as unknown as Json,
      })
      .select('id')
      .single();

    if (error || !lead) {
      console.error('[Form] Failed to create lead:', error);
      return { success: false, error: 'Failed to submit form. Please try again.' };
    }

    // Generate AI summary (non-blocking)
    generateLeadSummary({
      name: parsed.data.name,
      business_name: parsed.data.business_name || null,
      interview_data: {
        business_name: parsed.data.business_name,
        industry: parsed.data.industry,
        team_size: parsed.data.team_size,
        pain_points: parsed.data.pain_points,
        current_tools: parsed.data.current_tools || null,
        goals: parsed.data.goals,
      },
      interview_transcript: null,
    }).then(async (summary) => {
      if (summary) {
        await supabase
          .from('leads')
          .update({ ai_summary: summary })
          .eq('id', lead.id);
      }
    }).catch((err) => {
      console.error('[Form] Failed to generate AI summary:', err);
    });

    // Send confirmation email
    await sendEmail(
      parsed.data.email,
      'Thanks for your interest in Aush',
      createElement(LeadConfirmationEmail, { name: parsed.data.name })
    );

    // Send notification to admins
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['owner', 'admin']);

    if (adminRoles && adminRoles.length > 0) {
      const adminIds = adminRoles.map((r) => r.user_id);
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('email')
        .in('id', adminIds);

      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/leads`;

      if (adminProfiles) {
        for (const admin of adminProfiles) {
          await sendEmail(
            admin.email,
            `New Lead: ${parsed.data.name}`,
            createElement(NewLeadNotificationEmail, {
              leadName: parsed.data.name,
              leadEmail: parsed.data.email,
              businessName: parsed.data.business_name,
              source: 'form',
              dashboardUrl,
            })
          );
        }
      }
    }

    // In-app notification for admins
    await notifyAdmins(
      'new_lead',
      'New lead from form',
      `${parsed.data.name} submitted a form`,
      `/leads/${lead.id}`
    );

    return { success: true };
  } catch (err) {
    console.error('[Form] Unexpected error in submitFallbackForm:', err);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
