'use client';

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
import { StatusBadge } from '@/components/dashboard/status-badge';
import type { Lead } from '@/types';

interface LeadTableProps {
  leads: Lead[];
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

  return (
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
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className="cursor-pointer"
              onClick={() => router.push(`/leads/${lead.id}`)}
            >
              <TableCell className="font-medium text-gray-900">
                {lead.name}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
