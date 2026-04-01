import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLead, getLeadNotes } from '@/lib/queries/leads';
import { getLeadActivity } from '@/lib/queries/activity';
import { getTeamMembers } from '@/lib/queries/team';
import { LeadDetailHeader } from '@/components/dashboard/lead-detail-header';
import { LeadDetailTabs } from '@/components/dashboard/lead-detail-tabs';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;

  const [lead, notesResult, activityResult, teamMembers] = await Promise.all([
    getLead(id),
    getLeadNotes(id),
    getLeadActivity(id),
    getTeamMembers(),
  ]);

  if (!lead) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </Link>

      <LeadDetailHeader lead={lead} teamMembers={teamMembers} />

      <LeadDetailTabs
        lead={lead}
        initialNotes={notesResult.data}
        activityEntries={activityResult.data}
      />
    </div>
  );
}
