import { getDuplicateLeads } from '@/lib/queries/leads';
import { DuplicateWarningClient } from './duplicate-warning-client';

interface DuplicateWarningProps {
  leadId: string;
  email: string;
}

export async function DuplicateWarning({ leadId, email }: DuplicateWarningProps) {
  const duplicates = await getDuplicateLeads(email, leadId);

  if (duplicates.length === 0) return null;

  return <DuplicateWarningClient duplicates={duplicates} />;
}
