'use client';

import { useSortable } from '@dnd-kit/react/sortable';
import type { Lead } from '@/types';

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

interface PipelineCardProps {
  lead: Lead;
  index: number;
  column: string;
}

export function PipelineCard({ lead, index, column }: PipelineCardProps) {
  const { ref, isDragging } = useSortable({
    id: lead.id,
    index,
    group: column,
    type: 'item',
    data: { lead },
  });

  const days = daysSince(lead.stage_entered_at);

  return (
    <div
      ref={ref}
      data-dragging={isDragging || undefined}
      className="border border-gray-200 bg-white p-3 text-sm cursor-grab active:cursor-grabbing data-[dragging]:opacity-50 data-[dragging]:shadow-sm"
    >
      <p className="font-medium text-gray-900 truncate">{lead.name}</p>
      {lead.business_name && (
        <p className="text-xs text-gray-500 truncate mt-0.5">{lead.business_name}</p>
      )}
      <p className="text-xs text-gray-400 mt-1">
        {days === 0 ? 'Today' : `${days}d in stage`}
      </p>
    </div>
  );
}
