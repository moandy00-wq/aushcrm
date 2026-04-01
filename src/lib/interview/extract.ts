import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { interviewExtractionSchema } from '@/types/schemas';
import type { ChatMessage, InterviewData } from '@/types';

export async function extractInterviewData(
  messages: ChatMessage[]
): Promise<InterviewData> {
  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Prospect' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  try {
    const { experimental_output } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: `Extract structured data from this intake interview transcript. Pull out all relevant business information discussed. If a field was not discussed, leave it as an empty string or empty array.\n\nTranscript:\n${transcript}`,
      experimental_output: Output.object({ schema: interviewExtractionSchema }),
    });

    return experimental_output as InterviewData;
  } catch (err) {
    console.error('[Extract] Failed to extract interview data:', err);
    return {
      business_name: '',
      industry: '',
      business_model: '',
      team_size: '',
      pain_points: [],
      current_tools: '',
      goals: '',
      referral_source: '',
      additional_notes: 'Extraction failed — review transcript manually.',
    };
  }
}
