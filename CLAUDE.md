# AushCRM — Project Instructions

## Overview

AushCRM is an internal CRM for the Aush company (custom-tailored CRM solutions for business owners). Prospects apply through an AI chat interview on the landing page. The Aush team manages leads through a role-based dashboard with pipeline tracking, built-in email, status change request workflows, and analytics.

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| Next.js | 14.2.35 | App Router, SSR, API routes |
| React | 18 | UI |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3.4 | Styling |
| Framer Motion | 12.38 | Landing page animations |
| Supabase | TBD | Auth (email/password) + PostgreSQL + RLS |
| Resend | TBD | Email (confirmations, notifications, built-in send-to-leads) |
| Claude API | TBD | AI chat interview engine |
| Lucide React | 1.7 | Icons |
| Radix UI | latest | Accessible primitives |
| CVA | 0.7 | Component variants |
| clsx + tailwind-merge | latest | Class merging |
| Vercel | — | Hosting |

## Build Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npx tsc --noEmit     # Type check
```

## Code Style

- TypeScript strict mode — no `any` types
- Functional components only, no class components
- Named exports for components, default export only for pages
- File naming: kebab-case for files (`lead-card.tsx`), PascalCase for components (`LeadCard`)
- Imports: `@/` alias for `src/` directory
- Tailwind only for styling — no CSS modules, no inline styles, no styled-components
- Server Components by default, `"use client"` only when needed (interactivity, hooks, browser APIs)
- Server Actions for mutations, not API routes (unless webhook endpoints)
- Colocate types in the same file unless shared across 3+ files, then move to `src/types/`

## Architecture

```
src/
  app/
    page.tsx                    # Landing page (existing)
    layout.tsx                  # Root layout
    providers.tsx               # Theme provider
    globals.css                 # Global styles + CSS variables
    fonts/                      # Local fonts
    interview/
      page.tsx                  # AI chat interview page
    (dashboard)/                # Route group for authenticated pages
      layout.tsx                # Dashboard layout (sidebar, auth guard)
      dashboard/
        page.tsx                # Main dashboard (analytics for admin/owner, lead list for team member)
      leads/
        page.tsx                # All leads list
        [id]/
          page.tsx              # Single lead detail (notes, emails, activity, status)
      pipeline/
        page.tsx                # Kanban board
      team/
        page.tsx                # Team management (owner only)
      requests/
        page.tsx                # Status change request queue (admin/owner)
      settings/
        page.tsx                # Account settings (owner only)
    api/
      interview/
        route.ts                # AI chat interview endpoint (Claude API)
      webhooks/
        resend/
          route.ts              # Resend webhook for email status
  components/
    landing/                    # Existing landing page components
    dashboard/                  # Dashboard-specific components
    interview/                  # Chat interview components
    ui/                         # Shared UI primitives (button, input, card, etc.)
    icons/                      # Icon components
  lib/
    supabase/
      client.ts                 # Browser Supabase client
      server.ts                 # Server Supabase client
      middleware.ts             # Auth middleware
    resend.ts                   # Resend client + email helpers
    claude.ts                   # Claude API client for interview
    utils.ts                    # General utilities
  types/
    database.ts                 # Supabase generated types
    index.ts                    # Shared types (Lead, User, Role, StatusRequest, etc.)
  hooks/
    use-leads.ts                # Lead data hooks
    use-auth.ts                 # Auth state hooks
```

### Data Flow

1. **Visitor → AI Interview → Lead record**: Visitor chats with AI on `/interview`. Claude API processes conversation. On completion, a Server Action structures the answers and inserts a lead into Supabase. Resend sends confirmation email.
2. **Lead → Pipeline → Team**: Admins view leads in the pipeline board. Drag to change stage. Assign to team members. Team members see only their assigned leads.
3. **Status Change Request**: Team member submits request → row inserted in `status_requests` table → admin sees it in the requests queue → approves/denies → lead status updated (or not).
4. **Built-in Email**: Admin/owner composes email in the lead detail page → sent via Resend API → logged in `lead_emails` table → visible in the lead's activity timeline.
5. **Notifications**: Supabase database webhook or trigger fires on new lead insert → sends notification email via Resend to admins.

## Database Tables (Supabase)

- `profiles` — user profiles linked to Supabase Auth (id, email, name, role, avatar_url)
- `leads` — lead records (id, name, email, status, assigned_to, source, interview_data JSONB, created_at)
- `lead_notes` — notes on leads (id, lead_id, author_id, content, created_at)
- `lead_emails` — emails sent to leads (id, lead_id, sender_id, subject, body, resend_id, status, created_at)
- `status_requests` — status change requests (id, lead_id, requester_id, current_status, requested_status, note, decision, decided_by, created_at, decided_at)
- `activity_log` — all actions (id, lead_id, user_id, action, details JSONB, created_at)
- `invitations` — team invitations (id, email, role, invited_by, accepted, created_at)

Row Level Security enforced on all tables. Team members can only read leads where `assigned_to = auth.uid()`.

## Testing

- Type check: `npx tsc --noEmit` must pass with zero errors
- Lint: `npm run lint` must pass clean
- Build: `npm run build` must succeed
- Visual: Chrome DevTools / Playwright for UI verification after each feature
- Auth: test all three roles to confirm access controls work

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
NEXT_PUBLIC_APP_URL=
```

## Rules

- Preserve the existing landing page — do not modify existing landing page components unless adding the chat interview CTA
- Light mode for the dashboard — no dark mode toggle in the dashboard
- Landing page keeps its existing light/dark theme support
- No rounded corners on cards, containers, or sections (rounded-sm max on buttons/inputs, rounded-full on avatars/badges only)
- Sharp, professional design — no gradients, no glows, no shadows on cards (use borders)
- 8px spacing grid
- All lead data access must go through Supabase RLS — never trust client-side role checks alone
- Never expose service role key to the client
- Email sending must be server-side only (Server Actions or API routes)
- AI interview must have system prompt guardrails — the AI represents Aush and must stay professional and on-topic
- Status changes for team members must go through the request/approval flow — no direct status mutations
