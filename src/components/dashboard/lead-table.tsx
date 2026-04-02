'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import type { Lead } from '@/types';

interface LeadWithDuplicates extends Lead {
  duplicateCount?: number;
  duplicateIds?: string[];
}

interface LeadTableProps {
  leads: LeadWithDuplicates[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function LeadTable({ leads }: LeadTableProps) {
  const router = useRouter();
  const [collapseDuplicates, setCollapseDuplicates] = useState(true);

  // Group leads: primary (first occurrence of each email) and duplicates
  const seen = new Set<string>();
  const primaryLeads: LeadWithDuplicates[] = [];
  const duplicateLeads: LeadWithDuplicates[] = [];

  for (const lead of leads) {
    if (lead.duplicateCount && lead.duplicateCount > 0 && seen.has(lead.email)) {
      duplicateLeads.push(lead);
    } else {
      primaryLeads.push(lead);
      if (lead.duplicateCount && lead.duplicateCount > 0) {
        seen.add(lead.email);
      }
    }
  }

  const hasDuplicates = duplicateLeads.length > 0;

  function LeadRow({ lead, isDuplicate }: { lead: LeadWithDuplicates; isDuplicate?: boolean }) {
    return (
      <TableRow
        className={`cursor-pointer ${isDuplicate ? 'bg-amber-50/50' : ''}`}
        onClick={() => router.push(`/leads/${lead.id}`)}
      >
        <TableCell className="font-medium text-gray-900">
          <div className="flex items-center gap-2">
            {lead.name}
            {lead.duplicateCount && lead.duplicateCount > 0 && !isDuplicate && (
              <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                <AlertTriangle className="h-3 w-3 mr-0.5" />
                {lead.duplicateCount} dupe{lead.duplicateCount > 1 ? 's' : ''}
              </Badge>
            )}
            {isDuplicate && (
              <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                duplicate
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>{lead.email}</TableCell>
        <TableCell>{lead.business_name ?? '--'}</TableCell>
        <TableCell>
          <StatusBadge status={lead.status} />
        </TableCell>
        <TableCell>
          {lead.assigned_profile ? (
            <div className="flex items-center gap-2">
              <Avatar
                size="sm"
                src={lead.assigned_profile.avatar_url}
                fallback={lead.assigned_profile.full_name}
              />
              <span className="text-sm text-gray-700">
                {lead.assigned_profile.full_name}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Unassigned</span>
          )}
        </TableCell>
        <TableCell className="text-gray-500">
          {formatDate(lead.created_at)}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="space-y-2">
      <div className="border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {primaryLeads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </TableBody>
        </Table>
      </div>

      {hasDuplicates && (
        <div className="border border-amber-200 bg-amber-50/30">
          <button
            onClick={() => setCollapseDuplicates(!collapseDuplicates)}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 transition-colors"
          >
            {collapseDuplicates ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <AlertTriangle className="h-4 w-4" />
            {duplicateLeads.length} possible duplicate{duplicateLeads.length > 1 ? 's' : ''} found
          </button>
          {!collapseDuplicates && (
            <Table>
              <TableBody>
                {duplicateLeads.map((lead) => (
                  <LeadRow key={lead.id} lead={lead} isDuplicate />
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
