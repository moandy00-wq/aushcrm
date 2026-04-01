import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PipelineBoard } from '@/components/dashboard/pipeline-board';
import { PIPELINE_STAGES } from '@/lib/constants';
import type { Lead, AppRole } from '@/types';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check role — team_member cannot access pipeline
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!userRole || (userRole.role as AppRole) === 'team_member') {
    redirect('/dashboard');
  }

  // Fetch all active leads
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .is('deleted_at', null)
    .order('position', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  // Group by status
  const grouped: Record<string, Lead[]> = {};
  for (const stage of PIPELINE_STAGES) {
    grouped[stage.value] = [];
  }
  for (const lead of (leads ?? []) as unknown as Lead[]) {
    if (grouped[lead.status]) {
      grouped[lead.status].push(lead);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Pipeline</h1>
      <PipelineBoard initialData={grouped} />
    </div>
  );
}
