import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { UserProvider } from '@/hooks/use-user';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type { AuthUser, AppRole } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch profile and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || !userRole) {
    redirect('/auth/deactivated');
  }

  const authUser: AuthUser = {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: userRole.role as AppRole,
  };

  return (
    <div className="light" style={{ colorScheme: 'light' }}>
      <UserProvider user={authUser}>
        <DashboardShell>{children}</DashboardShell>
      </UserProvider>
    </div>
  );
}
