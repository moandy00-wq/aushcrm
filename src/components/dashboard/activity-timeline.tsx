import {
  ArrowRightLeft,
  UserPlus,
  Plus,
  Trash2,
  Mail,
  Activity,
} from 'lucide-react';
import type { ActivityLogEntry } from '@/types';

interface ActivityTimelineProps {
  entries: ActivityLogEntry[];
}

function getActionIcon(action: string) {
  switch (action) {
    case 'status_changed':
      return <ArrowRightLeft className="h-4 w-4" />;
    case 'assigned':
      return <UserPlus className="h-4 w-4" />;
    case 'created':
      return <Plus className="h-4 w-4" />;
    case 'deleted':
      return <Trash2 className="h-4 w-4" />;
    case 'email_sent':
      return <Mail className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

function formatDescription(entry: ActivityLogEntry): string {
  const meta = entry.metadata ?? {};
  const userName = entry.user?.full_name ?? 'System';

  switch (entry.action) {
    case 'status_changed':
      return `${userName} changed status from ${meta.from_status ?? 'unknown'} to ${meta.to_status ?? 'unknown'}`;
    case 'assigned':
      return meta.assigned_to_name
        ? `${userName} assigned lead to ${meta.assigned_to_name}`
        : `${userName} unassigned lead`;
    case 'created':
      return `${userName} created this lead`;
    case 'deleted':
      return `${userName} deleted this lead`;
    case 'note_added':
      return `${userName} added a note`;
    case 'email_sent':
      return `${userName} sent an email`;
    default:
      return `${userName} performed ${entry.action.replace(/_/g, ' ')}`;
  }
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ActivityTimeline({ entries }: ActivityTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, index) => (
        <div key={entry.id} className="relative flex gap-4 pb-6">
          {index < entries.length - 1 && (
            <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200" />
          )}
          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center border border-gray-200 bg-white text-gray-500">
            {getActionIcon(entry.action)}
          </div>
          <div className="flex-1 pt-1">
            <p className="text-sm text-gray-700">
              {formatDescription(entry)}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {formatTimestamp(entry.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
