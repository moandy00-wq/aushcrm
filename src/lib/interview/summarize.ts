import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

interface SummarizeInput {
  name: string;
  business_name: string | null;
  interview_data: Record<string, unknown> | null;
  interview_transcript: { role: string; content: string }[] | null;
}

export async function generateLeadSummary(
  lead: SummarizeInput
): Promise<string | null> {
  try {
    const dataContext = lead.interview_data
      ? `Interview Data:\n${JSON.stringify(lead.interview_data, null, 2)}`
      : '';

    const transcriptContext = lead.interview_transcript
      ? `Transcript:\n${lead.interview_transcript
          .map((m) => `${m.role === 'user' ? 'Prospect' : 'Assistant'}: ${m.content}`)
          .join('\n\n')}`
      : '';

    const context = [dataContext, transcriptContext].filter(Boolean).join('\n\n');

    if (!context) {
      return null;
    }

    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: `You are a CRM assistant. Based on this lead's interview data, write a 3-4 sentence summary covering: who they are and their business, their main pain points and needs, urgency level, and a recommended next step for the sales team. Be concise and actionable.

Lead Name: ${lead.name}
Business: ${lead.business_name || 'Not provided'}

${context}`,
    });

    return text;
  } catch (err) {
    console.error('[Summarize] Failed to generate lead summary:', err);
    return null;
  }
}
