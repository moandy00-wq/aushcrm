import { resend } from './resend';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';

interface SendEmailResult {
  success: boolean;
  error?: string;
  resendId?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  react: ReactElement
): Promise<SendEmailResult> {
  try {
    const html = await render(react);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'AushCRM <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Failed to send:', error);
      return { success: false, error: error.message };
    }

    return { success: true, resendId: data?.id };
  } catch (err) {
    console.error('[Email] Unexpected error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}
