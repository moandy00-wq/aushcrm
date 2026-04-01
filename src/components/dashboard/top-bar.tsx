'use client';

import Image from 'next/image';
import { Menu } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function TopBar({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const user = useUser();

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Left: mobile menu button */}
      <button
        onClick={onMenuClick}
        className="p-1.5 text-gray-500 hover:text-gray-700 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* Right: user info */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 text-xs font-medium',
            ROLE_COLORS[user.role]
          )}
        >
          {ROLE_LABELS[user.role]}
        </span>

        <div className="flex items-center gap-2">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.full_name}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
              {initials}
            </div>
          )}
          <span className="hidden text-sm font-medium text-gray-700 sm:block">
            {user.full_name}
          </span>
        </div>
      </div>
    </header>
  );
}
