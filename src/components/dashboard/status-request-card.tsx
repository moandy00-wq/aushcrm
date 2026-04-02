'use client';

import { useState } from 'react';
import { decideStatusRequest } from '@/lib/actions/status-requests';
import { STATUS_COLORS } from '@/lib/constants';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import type { StatusRequest } from '@/types';

interface StatusRequestWithNote extends StatusRequest {
  decision_note?: string | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface StatusRequestCardProps {
  request: StatusRequestWithNote;
}

export function StatusRequestCard({ request }: StatusRequestCardProps) {
  const user = useUser();
  const [loading, setLoading] = useState(false);
  const [decisionNote, setDecisionNote] = useState('');
  const isDecider = user.role === 'owner' || user.role === 'admin';
  const isPending = request.decision === null;

  async function handleDecision(decision: 'approved' | 'denied') {
    setLoading(true);
    const result = await decideStatusRequest({
      request_id: request.id,
      decision,
      decision_note: decisionNote || undefined,
    });

    if (!result.success) {
      toast('error', result.error ?? 'Something went wrong');
    } else {
      toast('success', `Status request has been ${decision}.`);
      setDecisionNote('');
    }
    setLoading(false);
  }

  return (
    <div className="border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 truncate">
            {request.lead?.name ?? 'Unknown lead'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Requested by {request.requester?.full_name ?? 'Unknown'} &middot; {timeAgo(request.created_at)}
          </p>
        </div>
        {!isPending && (
          <span
            className={cn(
              'shrink-0 inline-flex px-2 py-0.5 text-xs font-medium',
              request.decision === 'approved'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            )}
          >
            {request.decision}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs">
        <span className={cn('inline-flex px-2 py-0.5 font-medium', STATUS_COLORS[request.current_status])}>
          {request.current_status.replace(/_/g, ' ')}
        </span>
        <span className="text-gray-400">&rarr;</span>
        <span className={cn('inline-flex px-2 py-0.5 font-medium', STATUS_COLORS[request.requested_status])}>
          {request.requested_status.replace(/_/g, ' ')}
        </span>
      </div>

      {request.note && (
        <p className="text-sm text-gray-600 mt-2">{request.note}</p>
      )}

      {!isPending && request.decision_note && (
        <p className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">
          <span className="font-medium">Note:</span> {request.decision_note}
        </p>
      )}

      {isPending && isDecider && (
        <div className="mt-3 space-y-2">
          <textarea
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="w-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleDecision('approved')}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => handleDecision('denied')}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Deny
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
