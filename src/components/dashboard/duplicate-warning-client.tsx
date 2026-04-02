'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { StatusBadge } from './status-badge';
import type { LeadStatus } from '@/types';

interface DuplicateWarningClientProps {
  duplicates: { id: string; name: string; status: string; created_at: string }[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DuplicateWarningClient({ duplicates }: DuplicateWarningClientProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-amber-200 bg-amber-50/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {duplicates.length} possible duplicate{duplicates.length > 1 ? 's' : ''} with the same email
      </button>
      {expanded && (
        <div className="border-t border-amber-200 px-4 py-2 space-y-1">
          {duplicates.map((dupe) => (
            <Link
              key={dupe.id}
              href={`/leads/${dupe.id}`}
              className="flex items-center justify-between py-1.5 text-sm hover:bg-amber-50 px-2 -mx-2 transition-colors"
            >
              <span className="text-amber-900 font-medium">{dupe.name}</span>
              <div className="flex items-center gap-3">
                <StatusBadge status={dupe.status as LeadStatus} />
                <span className="text-xs text-amber-600">{formatDate(dupe.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
