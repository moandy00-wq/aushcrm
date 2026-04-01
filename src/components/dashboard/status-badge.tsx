import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS } from '@/lib/constants';
import type { LeadStatus } from '@/types';
import { PIPELINE_STAGES } from '@/lib/constants';

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

function getStatusLabel(status: LeadStatus): string {
  const stage = PIPELINE_STAGES.find((s) => s.value === status);
  return stage?.label ?? status;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge className={`${STATUS_COLORS[status]} ${className ?? ''}`}>
      {getStatusLabel(status)}
    </Badge>
  );
}
