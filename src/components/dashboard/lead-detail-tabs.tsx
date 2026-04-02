'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LeadOverview } from '@/components/dashboard/lead-overview';
import { LeadNotes } from '@/components/dashboard/lead-notes';
import { LeadEmails } from '@/components/dashboard/lead-emails';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import type { Lead, LeadEmail, LeadNote, ActivityLogEntry } from '@/types';

interface LeadDetailTabsProps {
  lead: Lead;
  initialNotes: LeadNote[];
  activityEntries: ActivityLogEntry[];
  initialEmails: LeadEmail[];
}

export function LeadDetailTabs({
  lead,
  initialNotes,
  activityEntries,
  initialEmails,
}: LeadDetailTabsProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="emails">Emails</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <LeadOverview
          interviewData={lead.interview_data}
          source={lead.source}
          aiSummary={lead.ai_summary}
        />
      </TabsContent>

      <TabsContent value="notes">
        <LeadNotes leadId={lead.id} initialNotes={initialNotes} />
      </TabsContent>

      <TabsContent value="emails">
        <LeadEmails leadId={lead.id} initialEmails={initialEmails} />
      </TabsContent>

      <TabsContent value="activity">
        <ActivityTimeline entries={activityEntries} />
      </TabsContent>
    </Tabs>
  );
}
