// Service role client — bypasses RLS. Server-only.
// IMPORTANT: Only used in interview.ts Server Actions (public lead creation/updates)
// and in team.ts (admin user management). Never import in client components.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
