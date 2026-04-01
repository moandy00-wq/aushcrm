'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Kanban,
  GitPullRequest,
  UserCog,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Kanban,
  GitPullRequest,
  UserCog,
  Settings,
};

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();
  const [signingOut, setSigningOut] = useState(false);

  const filteredItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role)
  );

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
          <span className="text-base font-bold tracking-tight text-gray-900">
            AushCRM
          </span>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {filteredItems.map((item) => {
              const Icon = iconMap[item.icon];
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sign out */}
        <div className="border-t border-gray-200 p-2">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </aside>
    </>
  );
}
