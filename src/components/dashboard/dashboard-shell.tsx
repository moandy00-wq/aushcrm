'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { ToastContainer } from '@/components/ui/toast';
import type { Notification } from '@/types';

interface DashboardShellProps {
  children: React.ReactNode;
  notificationCount?: number;
  notifications?: Notification[];
  sectionCounts?: Record<string, number>;
}

export function DashboardShell({ children, notificationCount = 0, notifications = [], sectionCounts = {} }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} sectionCounts={sectionCounts} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          notificationCount={notificationCount}
          notifications={notifications}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
