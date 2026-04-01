'use client';

import { useDroppable } from '@dnd-kit/react';
import { PipelineCard } from './pipeline-card';
import type { Lead } from '@/types';

interface PipelineColumnProps {
  id: string;
  label: string;
  color: string;
  leads: Lead[];
  onCardClick: (leadId: string) => void;
}

export function PipelineColumn({ id, label, color, leads, onCardClick }: PipelineColumnProps) {
  const { ref } = useDroppable({
    id,
    type: 'column',
  });

  return (
    <div
      ref={ref}
      className="flex flex-col w-64 min-w-[256px] shrink-0 bg-gray-50 border border-gray-200"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide truncate">
          {label}
        </span>
        <span className="ml-auto text-xs text-gray-400 font-medium">
          {leads.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
        {leads.map((lead, index) => (
          <div key={lead.id} onClick={() => onCardClick(lead.id)}>
            <PipelineCard lead={lead} index={index} column={id} />
          </div>
        ))}
      </div>
    </div>
  );
}
