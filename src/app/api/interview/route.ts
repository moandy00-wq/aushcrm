export const runtime = 'edge';

import { streamText, convertToModelMessages } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient } from '@supabase/supabase-js';
import { INTERVIEW_SYSTEM_PROMPT } from '@/lib/interview/system-prompt';

function createEdgeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const { messages, leadId, nonce } = await req.json();

    // Validate origin
    const origin = req.headers.get('origin');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl && origin && origin !== appUrl) {
      return new Response('Forbidden', { status: 403 });
    }

    if (!leadId || !nonce || !messages) {
      return new Response('Bad request', { status: 400 });
    }

    // Validate lead via Supabase
    const supabase = createEdgeAdminClient();
    const { data: lead, error } = await supabase
      .from('leads')
      .select('id, is_complete, interview_nonce, interview_message_count')
      .eq('id', leadId)
      .single();

    if (error || !lead) {
      return new Response('Lead not found', { status: 404 });
    }

    if (lead.is_complete) {
      return new Response('Interview already completed', { status: 400 });
    }

    if (lead.interview_nonce !== nonce) {
      return new Response('Invalid session', { status: 403 });
    }

    if (lead.interview_message_count >= 20) {
      return new Response('Message limit reached', { status: 429 });
    }

    // Increment message count and save transcript
    await supabase
      .from('leads')
      .update({
        interview_message_count: (lead.interview_message_count || 0) + 1,
        interview_transcript: messages.map((m: { role: string; content?: string; parts?: Array<{ type: string; text?: string }> }) => ({
          role: m.role,
          content: m.content || m.parts?.find((p: { type: string; text?: string }) => p.type === 'text')?.text || '',
        })),
      })
      .eq('id', leadId);

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: INTERVIEW_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error('[Interview API] Error:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
