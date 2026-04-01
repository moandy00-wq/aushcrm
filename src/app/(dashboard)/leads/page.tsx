import { Suspense } from 'react';
import { getLeads } from '@/lib/queries/leads';
import { LeadTable } from '@/components/dashboard/lead-table';
import { LeadFilters } from '@/components/dashboard/lead-filters';
import { EmptyState } from '@/components/ui/empty-state';
import { Users } from 'lucide-react';
import type { LeadStatus } from '@/types';
import { LeadsPagination } from '@/components/dashboard/leads-pagination';

export const dynamic = 'force-dynamic';

interface LeadsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 25;
  const status = (params.status as LeadStatus) || undefined;
  const search = params.search || undefined;

  const result = await getLeads({ status, search }, { page, limit });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
      </div>

      <Suspense fallback={null}>
        <LeadFilters />
      </Suspense>

      {result.data.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No leads found"
          description={
            search || status
              ? 'Try adjusting your filters.'
              : 'Leads will appear here once they complete an interview.'
          }
        />
      ) : (
        <>
          <LeadTable leads={result.data} />
          {result.totalPages > 1 && (
            <LeadsPagination page={result.page} totalPages={result.totalPages} />
          )}
        </>
      )}
    </div>
  );
}
