'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notifications';
import { useUser } from '@/hooks/use-user';
import type { Notification } from '@/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface NotificationBellProps {
  initialCount: number;
  initialNotifications: Notification[];
}

export function NotificationBell({ initialCount, initialNotifications }: NotificationBellProps) {
  const user = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [notifications, setNotifications] = useState(initialNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Subscribe to realtime notifications
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
          setCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const handleNotificationClick = useCallback(
    async (notif: Notification) => {
      if (!notif.read_at) {
        await markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n
          )
        );
        setCount((prev) => Math.max(0, prev - 1));
      }
      setOpen(false);
      if (notif.link) {
        router.push(notif.link);
      }
    },
    [router]
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    setCount(0);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 text-gray-500 hover:text-gray-700"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 border border-gray-200 bg-white shadow-sm z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {count > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-gray-50 ${
                    notif.read_at ? 'opacity-60' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {notif.body}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {timeAgo(notif.created_at)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
