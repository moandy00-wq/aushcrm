# AushCRM — Research Findings (Phase 2 Complete)

## Track A: Codebase Exploration

### Current State Summary

| Area | Status |
|---|---|
| Landing page | Complete — animations, dark/light mode, responsive |
| AI Interview | Not started |
| Supabase (auth, DB, RLS) | Not started |
| Dashboard | Not started |
| Email (Resend) | Not started |
| API routes / Server Actions | Not started |
| Types / Interfaces | Minimal (landing components only) |

### File Structure (What Exists)

```
src/
├── app/
│   ├── layout.tsx              # Root layout, Inter font, ThemeProvider
│   ├── page.tsx                # Landing page (composes all sections)
│   ├── providers.tsx           # ThemeProvider only
│   ├── globals.css             # CSS variables for light/dark design tokens
│   └── fonts/                  # Geist fonts
├── components/
│   ├── landing/                # 8 components (navbar, hero, features, etc.)
│   ├── ui/                     # 5 components (sliders, loaders, animations)
│   └── icons/logos.tsx
├── lib/utils.ts                # cn() utility only
└── hooks/use-mobile.ts         # useIsMobile hook
```

### Key Technical Details

- **Next.js 14.2.35** with App Router, TypeScript strict mode
- **Tailwind 3.4.1** with CSS variable design tokens, dark mode via `class`
- **Path alias**: `@/*` → `./src/*`
- **Animations**: Framer Motion 12.38, scroll-driven effects, spring physics
- **No backend infrastructure**: zero API routes, no Supabase client, no env vars set
- **CTA buttons** all link to `#get-started` — need routing to `/interview`

### Dependencies Installed

`next@14.2.35`, `react@^18`, `framer-motion@^12.38`, `motion@^12.38`, `next-themes@^0.4.6`, `lucide-react@^1.7`, `@radix-ui/react-slot@^1.2.4`, `class-variance-authority@^0.7.1`, `clsx@^2.1.1`, `tailwind-merge@^3.5`, `react-use-measure@^2.1.7`

### Dependencies NOT Yet Installed

`@supabase/supabase-js`, `@supabase/ssr`, `ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`, `resend`, `@react-email/components`, `@dnd-kit/react`, `zod`

### Design System (CSS Variables)

Light: `--background: #fff`, `--foreground: #141414`, `--surface: #F5F5F5`, `--accent: #141414`
Dark: `--background: #0A0A0A`, `--foreground: #F5F5F5`, `--surface: #141414`, `--accent: #F5F5F5`

Dashboard will be light mode only. No rounded corners on containers.

---

## Track B: Web Research

### 1. Supabase Auth + RLS for Role-Based Access

**Best practice**: Store roles in a `user_roles` table (not user metadata). Use a **Custom Access Token Hook** (PL/pgSQL function) to inject `user_role` into the JWT on every token refresh.

```sql
create type public.app_role as enum ('owner', 'admin', 'team_member');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  role app_role not null default 'team_member'
);

-- Hook function injects role into JWT claims
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable as $$
  declare claims jsonb; user_role public.app_role;
  begin
    select role into user_role from public.user_roles where user_id = (event->>'user_id')::uuid;
    claims := event->'claims';
    claims := jsonb_set(claims, '{user_role}', coalesce(to_jsonb(user_role), 'null'));
    event := jsonb_set(event, '{claims}', claims);
    return event;
  end;
$$;
```

**Authorize helper** for clean RLS policies:

```sql
create or replace function public.authorize(requested_permission app_permission)
returns boolean as $$
  select count(*) > 0 from public.role_permissions
  where permission = requested_permission
    and role = (auth.jwt() ->> 'user_role')::public.app_role;
$$ language plpgsql stable security definer;
```

**Key rules**:
- Never use `getSession()` server-side — always `getUser()` (revalidates with auth server)
- Never expose `service_role` key to client
- Index all columns referenced in RLS policies
- Keep RLS policies simple — complex joins kill performance

### 2. Next.js 14 + Supabase SSR

Use `@supabase/ssr` (not the deprecated `auth-helpers`). Two factory functions:
- `createBrowserClient()` — Client Components
- `createServerClient()` — Server Components, Server Actions, Route Handlers, Middleware

**Middleware is critical** — refreshes expired auth tokens on every request. Without it, sessions silently expire.

Key patterns:
- Server Components: `createServerClient()` with `cookies()`, use `supabase.auth.getUser()`
- Use `export const dynamic = 'force-dynamic'` on authenticated pages
- PKCE is default flow, cookie-based session storage is automatic

### 3. AI Chat Interview with Claude API

**Recommended**: Vercel AI SDK (`ai` + `@ai-sdk/anthropic` + `@ai-sdk/react`)

Server-side:
```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages,
  });
  return result.toUIMessageStreamResponse();
}
```

Client-side: `useChat()` hook from `@ai-sdk/react` handles all state.

**Structured data extraction**: Use `Output.object()` with Zod schema to extract lead data from conversation:
```typescript
const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  output: Output.object({
    schema: z.object({
      businessName: z.string(),
      industry: z.string(),
      painPoints: z.array(z.string()),
    }),
  }),
});
```

Key: Set `maxDuration = 30` on route handlers to prevent Vercel timeouts. Store conversation history in Supabase for resumability.

### 4. Resend Email in Next.js

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'AushCRM <noreply@aush.com>',
  to,
  subject: 'Welcome',
  react: WelcomeEmail({ name }),
});
```

Use `@react-email/components` for templates (React components). Always send from Server Actions or Route Handlers — never client-side.

Free tier: 100 emails/day, 3,000/month. Domain verification required for production.

### 5. Kanban / Pipeline Board

**Use dnd-kit** (`@dnd-kit/react`). Best balance of animations, touch support, accessibility, and active maintenance.

- `react-beautiful-dnd` is deprecated
- `@hello-pangea/dnd` (community fork) is maintenance-only
- dnd-kit's new API: `DragDropProvider` + `useSortable` with `group` prop for multi-list

**Real-time sync**: Supabase `postgres_changes` subscription on leads table. Use optimistic updates — update local state on drag end, then sync to DB.

**Important**: Use a `position` integer column for ordering, not array indices.

### 6. CRM Database Schema Best Practices

**Soft deletes**: Use `deleted_at TIMESTAMPTZ` (nullable). Create partial indexes:
```sql
CREATE INDEX idx_leads_active ON leads(id) WHERE deleted_at IS NULL;
```

**Audit log**: Single generic table with JSONB + PostgreSQL trigger function that fires on all tracked tables. Store `old_data` and `new_data` as JSONB.

**Activity feed**: Polymorphic events table with `entity_type`, `entity_id`, `activity_type`, `metadata JSONB`.

**Lead assignment**: Always use UUID references, include `assigned_at` for response time tracking.

**General rules**:
- All timestamps: `TIMESTAMPTZ` in UTC
- Use Postgres enums for stable sets (pipeline stages, roles)
- Index all foreign keys and WHERE/ORDER BY columns
- Store `stage_entered_at` to calculate time-in-stage (don't store derived data)
- Don't add `org_id` multi-tenancy — this is single-org

---

## Key Decisions for Planning Phase

1. **Auth flow**: Supabase email/password + Custom Access Token Hook for JWT role injection
2. **SSR pattern**: `@supabase/ssr` with middleware for token refresh
3. **AI chat**: Vercel AI SDK streaming + Zod schema extraction
4. **Email**: Resend + React Email templates, triggered from Server Actions
5. **Kanban**: dnd-kit with Supabase realtime subscriptions
6. **Database**: Soft deletes, audit triggers, polymorphic activity feed, partial indexes
7. **No multi-tenancy needed** — single org (Aush company)
