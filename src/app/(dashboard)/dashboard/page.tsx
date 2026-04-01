import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single();

  const name = profile?.full_name ?? 'there';

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome to AushCRM, {name}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Your dashboard overview will appear here.
      </p>
    </div>
  );
}
