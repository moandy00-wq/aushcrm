import type { AppRole, LeadStatus } from '@/types';

export const PIPELINE_STAGES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: '#3b82f6' },
  { value: 'under_review', label: 'Under Review', color: '#f59e0b' },
  { value: 'contacted', label: 'Contacted', color: '#8b5cf6' },
  { value: 'demo_scheduled', label: 'Demo Scheduled', color: '#06b6d4' },
  { value: 'onboarding', label: 'Onboarding', color: '#10b981' },
  { value: 'active_client', label: 'Active Client', color: '#22c55e' },
  { value: 'closed_lost', label: 'Closed Lost', color: '#ef4444' },
];

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  team_member: 'Team Member',
};

export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  under_review: 'bg-amber-100 text-amber-800',
  contacted: 'bg-violet-100 text-violet-800',
  demo_scheduled: 'bg-cyan-100 text-cyan-800',
  onboarding: 'bg-emerald-100 text-emerald-800',
  active_client: 'bg-green-100 text-green-800',
  closed_lost: 'bg-red-100 text-red-800',
};

export const ROLE_COLORS: Record<AppRole, string> = {
  owner: 'bg-amber-100 text-amber-800',
  admin: 'bg-blue-100 text-blue-800',
  team_member: 'bg-gray-100 text-gray-800',
};

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  roles: AppRole[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: ['owner', 'admin', 'team_member'] },
  { label: 'Leads', href: '/leads', icon: 'Users', roles: ['owner', 'admin', 'team_member'] },
  { label: 'Pipeline', href: '/pipeline', icon: 'Kanban', roles: ['owner', 'admin'] },
  { label: 'Requests', href: '/requests', icon: 'GitPullRequest', roles: ['owner', 'admin', 'team_member'] },
  { label: 'Team', href: '/team', icon: 'UserCog', roles: ['owner'] },
  { label: 'Settings', href: '/settings', icon: 'Settings', roles: ['owner'] },
];
