'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function PaginationControls({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationControlsProps) {
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={isFirstPage}
      >
        Previous
      </Button>
      <span className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={isLastPage}
      >
        Next
      </Button>
    </div>
  );
}

export { PaginationControls };
