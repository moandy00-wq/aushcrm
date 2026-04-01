'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PaginationControls } from '@/components/ui/pagination';

interface LeadsPaginationProps {
  page: number;
  totalPages: number;
}

export function LeadsPagination({ page, totalPages }: LeadsPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/leads?${params.toString()}`);
  }

  return (
    <PaginationControls
      page={page}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}
