'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { PIPELINE_STAGES } from '@/lib/constants';

export function LeadFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') ?? '';
  const currentSearch = searchParams.get('search') ?? '';
  const [search, setSearch] = useState(currentSearch);

  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page');
      router.push(`/leads?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== currentSearch) {
        updateParams('search', search);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, currentSearch, updateParams]);

  return (
    <div className="flex items-center gap-3">
      <div className="w-64">
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="w-48">
        <Select
          value={currentStatus || 'all'}
          onValueChange={(val) => updateParams('status', val === 'all' ? '' : val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PIPELINE_STAGES.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
