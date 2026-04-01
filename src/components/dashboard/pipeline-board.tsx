'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropProvider } from '@dnd-kit/react';
import { PipelineColumn } from './pipeline-column';
import { useRealtimeLeads } from '@/hooks/use-realtime-leads';
import { moveLeadInPipeline } from '@/lib/actions/leads';
import { PIPELINE_STAGES } from '@/lib/constants';
import { toast } from '@/hooks/use-toast';
import type { Lead, LeadStatus } from '@/types';

interface PipelineBoardProps {
  initialData: Record<string, Lead[]>;
}

export function PipelineBoard({ initialData }: PipelineBoardProps) {
  const router = useRouter();
  const [columns, setColumns] = useState<Record<string, Lead[]>>(initialData);

  useRealtimeLeads();

  const handleCardClick = useCallback(
    (leadId: string) => {
      router.push(`/leads/${leadId}`);
    },
    [router]
  );

  const handleDragEnd = useCallback(
    async (event: { operation: { source: { id: unknown; data?: Record<string, unknown> } | null; target: { id: unknown } | null } }) => {
      const { source, target } = event.operation;
      if (!source || !target) return;

      const sourceId = String(source.id);
      const lead = source.data?.lead as Lead | undefined;
      if (!lead) return;

      // Find which column the lead was dragged to
      // The target could be a column or another card in a column
      let targetColumn: string | null = null;

      // Check if target is a column
      const stageValues = PIPELINE_STAGES.map((s) => s.value);
      if (stageValues.includes(target.id as LeadStatus)) {
        targetColumn = String(target.id);
      } else {
        // Target is a card — find which column it belongs to
        for (const [col, leads] of Object.entries(columns)) {
          if ((leads as Lead[]).some((l) => l.id === String(target.id))) {
            targetColumn = col;
            break;
          }
        }
      }

      if (!targetColumn) return;

      const sourceColumn = lead.status;
      if (sourceColumn === targetColumn) return; // same column, no action

      // Optimistic update
      const prevColumns = { ...columns };
      setColumns((prev) => {
        const newCols = { ...prev };
        newCols[sourceColumn] = (prev[sourceColumn] ?? []).filter((l) => l.id !== sourceId);
        const movedLead = { ...lead, status: targetColumn as LeadStatus };
        newCols[targetColumn!] = [...(prev[targetColumn!] ?? []), movedLead];
        return newCols;
      });

      const result = await moveLeadInPipeline({
        lead_id: sourceId,
        status: targetColumn,
        position: (columns[targetColumn]?.length ?? 0),
      });

      if (!result.success) {
        // Revert
        setColumns(prevColumns);
        toast('error', result.error ?? 'Failed to move lead');
      }
    },
    [columns]
  );

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => (
          <PipelineColumn
            key={stage.value}
            id={stage.value}
            label={stage.label}
            color={stage.color}
            leads={columns[stage.value] ?? []}
            onCardClick={handleCardClick}
          />
        ))}
      </div>
    </DragDropProvider>
  );
}
