# AushCRM — Product Definition

## What is the end product?

AushCRM is an internal CRM platform used by Aush (a company that provides custom-tailored CRM solutions for business owners) to manage incoming leads. Business owners who are interested in Aush's services apply through an AI-powered chat interview on the landing page. Their responses are structured and stored as leads in the CRM dashboard, where the Aush team manages them through a defined pipeline.

The product has two main surfaces:

1. **Landing page + AI chat interview** — the public-facing side where prospects apply
2. **CRM dashboard** — the internal side where the Aush team manages leads, communicates with them, and tracks analytics

## Who is the user?

Three user types, all internal to the Aush company:

| Role | Who | What they see and do |
|---|---|---|
| **Owner** | The business owner (you) | Sees everything. Manages team, permissions, billing. Has a dedicated owner panel separate from admins. Invites people and assigns roles. |
| **Admin** | 3 senior team members | Sees all leads. Assigns leads to team members. Views analytics. Approves or denies status change requests from team members. Adds notes to leads. Sends emails to leads. |
| **Team Member** | Staff | Only sees leads assigned to them. Can add notes. Cannot change lead status directly — must submit a request with a note for admin approval. |

## What is the user workflow?

### For prospects (visitors):
1. Visit the landing page
2. Click "Get Started" (prominently placed)
3. Enter name + email (gate before chat starts)
4. Engage in an AI chat interview — the AI asks adaptive qualifying questions about their business
5. Alternatively, fill out a static fallback form
6. Receive an email confirmation via Resend after submission

### For the Aush team (dashboard users):
1. Log in to the CRM dashboard
2. See new leads that came in from the AI interview
3. Review lead details (all interview answers structured and displayed)
4. Move leads through pipeline stages: New > Under Review > Contacted > Demo Scheduled > Onboarding > Active Client > Closed Lost
5. Assign leads to team members
6. Send emails to leads directly from the dashboard
7. Add notes to leads
8. Team members request status changes with notes; admins approve/deny
9. View analytics (funnel, conversion rates, team performance, etc.)

## Core features

### AI Chat Interview (Landing Page)
- Conversational chatbot embedded on the landing page
- Gate: collects name + email before starting
- Asks adaptive qualifying questions (business type, model, team size, struggles, current tools, goals, how they heard about Aush)
- Has guardrails to stay on topic and handle unexpected responses
- Structures all answers and saves them as a lead record
- Fallback: static form with the same fields for users who prefer not to chat
- Sends email confirmation via Resend after completion

### CRM Dashboard
- **Lead management** — view all leads, filter, search, see full interview transcript/answers
- **Pipeline board** — Kanban-style drag-and-drop for admins/owner; visual pipeline stages
- **Status change requests** — team members submit requests with notes; admins approve/deny from a queue
- **Notes** — admins and owner can add notes to any lead, visible to other admins/owner
- **Built-in email** — send emails to leads from within the CRM via Resend
- **Notifications** — email notifications when a new lead comes in
- **Activity feed** — timeline of all actions taken on a lead (status changes, notes, emails sent, assignments)

### Analytics Dashboard (Admin + Owner)
- KPI cards: total leads, new leads this week, conversion rate
- Funnel chart: leads by pipeline stage with drop-off rates
- Line chart: leads over time (weekly/monthly)
- Bar chart: average time spent in each stage
- Team leaderboard: leads handled per team member
- Pending status requests queue
- Recent activity feed
- Leads by source (how did you hear about us)

### Auth + Roles
- Supabase Auth (email/password)
- Three roles: Owner, Admin, Team Member
- Owner invites team via email
- Owner assigns roles
- Role-based access controls enforced on every page and API route

## Tech stack

| Library/Service | Purpose |
|---|---|
| Next.js 14 | Frontend framework (App Router) |
| React 18 | UI library |
| TypeScript | Type safety |
| Tailwind CSS 3.4 | Styling |
| Framer Motion | Animations (landing page) |
| Supabase | Auth + PostgreSQL database + Row Level Security |
| Resend | Transactional email (confirmations + built-in email to leads) |
| Claude API | AI chat interview (adaptive questions + guardrails) |
| Vercel | Hosting + deployment |
| Lucide React | Icons |
| Radix UI | Accessible UI primitives |
| CVA + clsx + tailwind-merge | Component styling utilities |

## Acceptance criteria

The product is done when:

1. A visitor can complete the AI chat interview on the landing page and their data appears as a lead in the CRM
2. The fallback static form works and creates the same lead record
3. Email confirmation is sent after submission
4. Owner can log in, see all leads, manage team, assign roles
5. Admins can log in, see all leads, assign leads to team members, approve/deny status requests, add notes, send emails, view analytics
6. Team members can log in, see only their assigned leads, submit status change requests with notes, add notes
7. Pipeline board works with drag-and-drop (for admins/owner)
8. Analytics dashboard shows all specified metrics with real data
9. Email notifications fire when a new lead comes in
10. All role-based access is enforced (team members cannot see other team members' leads, cannot change status directly, etc.)

## Constraints

- **Purpose:** Internal tool for Aush team — not a multi-tenant SaaS (one organization, one Supabase project)
- **Design:** Light mode dashboard. Landing page already exists and should be preserved as-is with the chat interview added prominently.
- **Budget:** Free-tier services where possible (Supabase free tier, Vercel free tier, Resend free tier). Claude API and Resend usage costs are accepted.
- **Team:** Owner + 3 admins + a few team members from day one
- **No domain yet** — will use Vercel's default URL initially

## Edge cases

- Visitor closes the chat interview halfway through — save partial data as an incomplete lead
- Visitor tries to go off-topic in the chat — AI has guardrails to redirect
- Visitor submits the fallback form with minimal info — still create the lead, mark as incomplete
- Team member tries to access a lead not assigned to them — blocked by RLS
- Admin tries to access owner-only settings — blocked by role check
- Multiple admins assign the same lead to different team members — last write wins, activity feed shows the change
- Lead already exists (same email) — flag as duplicate, let admin decide whether to merge or keep separate
- Resend email fails — log the failure, show error in dashboard, allow retry
- AI chat interview API call fails mid-conversation — show error message, offer to restart or switch to fallback form
