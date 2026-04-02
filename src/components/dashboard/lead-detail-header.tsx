'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Textarea } from '@/components/ui/textarea';
import { updateLeadStatus, assignLead, softDeleteLead } from '@/lib/actions/leads';
import { createStatusRequest } from '@/lib/actions/status-requests';
import { useUser } from '@/hooks/use-user';
import { toast } from '@/hooks/use-toast';
import { PIPELINE_STAGES } from '@/lib/constants';
import { Trash2, AlertTriangle, GitPullRequest } from 'lucide-react';
import type { Lead, UserWithRole } from '@/types';

interface LeadDetailHeaderProps {
  lead: Lead;
  teamMembers: UserWithRole[];
}

function getDaysInStage(stageEnteredAt: string): number {
  const entered = new Date(stageEnteredAt);
  const now = new Date();
  return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
}

export function LeadDetailHeader({ lead, teamMembers }: LeadDetailHeaderProps) {
  const user = useUser();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestedStatus, setRequestedStatus] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const canManage = user.role === 'owner' || user.role === 'admin';
  const isTeamMember = user.role === 'team_member';
  const daysInStage = getDaysInStage(lead.stage_entered_at);

  function handleStatusChange(status: string) {
    startTransition(async () => {
      const result = await updateLeadStatus({ lead_id: lead.id, status });
      if (result.success) {
        toast('success', 'Status updated');
      } else {
        toast('error', result.error ?? 'Failed to update status');
      }
    });
  }

  function handleAssign(userId: string) {
    startTransition(async () => {
      const result = await assignLead({
        lead_id: lead.id,
        assigned_to: userId === 'unassigned' ? null : userId,
      });
      if (result.success) {
        toast('success', 'Lead assigned');
      } else {
        toast('error', result.error ?? 'Failed to assign lead');
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await softDeleteLead(lead.id);
      if (result.success) {
        toast('success', 'Lead deleted');
        router.push('/leads');
      } else {
        toast('error', result.error ?? 'Failed to delete lead');
      }
    });
  }

  return (
    <>
      <div className="border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{lead.email}</span>
              {lead.phone && <span>{lead.phone}</span>}
              {lead.business_name && (
                <span className="font-medium text-gray-700">
                  {lead.business_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <StatusBadge status={lead.status} />
              <span
                className={`text-xs font-medium ${
                  daysInStage >= 7
                    ? 'text-red-600'
                    : daysInStage >= 3
                    ? 'text-amber-600'
                    : 'text-gray-400'
                }`}
              >
                {daysInStage} {daysInStage === 1 ? 'day' : 'days'} in stage
              </span>
            </div>
          </div>

          {isTeamMember && (
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRequestOpen(true)}
              >
                <GitPullRequest className="h-4 w-4 mr-1" />
                Request Status Change
              </Button>
            </div>
          )}

          {canManage && (
            <div className="flex items-center gap-3">
              <div className="w-44">
                <Select
                  value={lead.status}
                  onValueChange={handleStatusChange}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-44">
                <Select
                  value={lead.assigned_to ?? 'unassigned'}
                  onValueChange={handleAssign}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                disabled={isPending}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Lead
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {lead.name}? This action can be undone by an administrator.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Status Change</DialogTitle>
            <DialogDescription>
              Request to change the status of {lead.name}. An admin will review your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                New Status
              </label>
              <Select value={requestedStatus} onValueChange={setRequestedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.filter((s) => s.value !== lead.status).map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Textarea
                label="Reason"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="Why should this status be changed?"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setRequestOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              disabled={isPending || !requestedStatus || !requestNote}
              onClick={() => {
                startTransition(async () => {
                  const result = await createStatusRequest({
                    lead_id: lead.id,
                    requested_status: requestedStatus,
                    note: requestNote,
                  });
                  if (result.success) {
                    toast('success', 'Status change request submitted');
                    setRequestOpen(false);
                    setRequestedStatus('');
                    setRequestNote('');
                  } else {
                    toast('error', result.error ?? 'Failed to submit request');
                  }
                });
              }}
            >
              {isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
