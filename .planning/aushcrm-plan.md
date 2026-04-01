# AushCRM — Implementation Plan (Reviewed)

> Generated via Sequential Thinking (15 steps). Revised after staff engineer adversarial review. Covers architecture, file structure, implementation phases, parallelization, edge cases, error handling, testing, acceptance criteria, shared contracts, and risks.

---

## Table of Contents

1. [Architecture Decisions](#1-architecture-decisions)
2. [Shared Contracts (Types + API Shapes)](#2-shared-contracts)
3. [Database Schema](#3-database-schema)
4. [RLS Policies](#4-rls-policies)
5. [File Structure](#5-file-structure)
6. [Implementation Phases](#6-implementation-phases)
7. [Parallelization Map](#7-parallelization-map)
8. [Edge Cases and Handling](#8-edge-cases)
9. [Error Handling Strategy](#9-error-handling-strategy)
10. [Testing Strategy](#10-testing-strategy)
11. [Risks and Mitigations](#11-risks-and-mitigations)
12. [Revision Log](#12-revision-log)

---

## 1. Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Auth | Supabase Auth (email/password) + Custom Access Token Hook | JWT role injection means RLS policies can read role from token — no extra DB query per request. Invite-only system (no public signup). |
| Role storage | `user_roles` table (not user metadata) | Queryable, auditable, supports RLS policies. Metadata is opaque and can't be used in RLS. |
| SSR auth | `@supabase/ssr` (not deprecated auth-helpers) | Official replacement. Creates server/browser clients with proper cookie handling. |
| Middleware | Token refresh + role validation on every request | Without this, sessions silently expire. Also validates that the user has a valid role — users with null role (removed) are redirected to a deactivation page. |
| AI chat | Vercel AI SDK v5+ (`ai` + `@ai-sdk/anthropic` + `@ai-sdk/react`) | `useChat()` with `DefaultChatTransport` handles streaming + message state. `sendMessage()` to send (not deprecated `handleSubmit`). `streamText()` on server. `generateText()` + `Output.object()` for extraction (not deprecated `generateObject()`). |
| AI route hosting | Vercel Edge Runtime (streaming, no timeout) | Vercel Hobby plan has a hard 10s limit on serverless functions. `maxDuration=30` only works on Pro. Edge Functions have no timeout for streaming responses, making them the correct choice for the AI interview endpoint on any Vercel plan. |
| Data extraction | Separate Claude call with Zod schema after interview ends | Decouples conversation from extraction. Zod validates output shape. Fallback: save raw transcript for manual review. |
| Email | Resend + React Email templates | Simple API, React components for templates, webhook for delivery tracking. Free tier sufficient for internal tool. |
| Kanban DnD | `@dnd-kit/react` | Actively maintained, best accessibility, touch support. `react-beautiful-dnd` is deprecated. |
| Kanban positioning | Full re-index per column on every move | For 6 users and <100 leads per column, re-indexing all cards in the destination column within a single transaction is simplest and sufficient. No gap-based or fractional positioning complexity needed. |
| Realtime | Supabase `postgres_changes` subscription | Built into Supabase. No extra infrastructure. Keeps kanban board synced across users. |
| Charts | Recharts | Most popular React charting library. Handles all needed chart types (line, bar, funnel, pie). |
| Mutations | Server Actions (not API routes) | Colocated with the UI that calls them. Type-safe. API routes only for webhooks and streaming AI. |
| Soft deletes | `deleted_at TIMESTAMPTZ` on leads | Recoverable. Partial indexes keep active queries fast. |
| Audit trail | PostgreSQL trigger → `activity_log` table | Automatic — every INSERT/UPDATE/DELETE on tracked tables is logged without manual coding per feature. Stores only changed field names and specific action metadata — never full row data (PII protection). |
| Multi-tenancy | None (single org) | Spec says single org. No `org_id` column. Simplifies everything. |
| Dashboard theme | Light mode only | Spec requirement. Landing page keeps its existing light/dark toggle. Dashboard forces light. |
| Public endpoint security | Rate limiting + honeypot + nonce tokens | The interview endpoint and related Server Actions are public. They require IP-based rate limiting, honeypot fields on the gate form, per-lead message caps, and nonce-based session validation to prevent abuse. |
| CSRF protection | Next.js 14 built-in + explicit origin check on public actions | Next.js 14 Server Actions include origin header checking by default. Public interview actions additionally validate the origin header explicitly since they bypass auth. |
| Pagination | Server-side on all list queries from day one | `getLeads()` and `getLeadActivity()` use Supabase `.range()` with page + limit params. Prevents "works in dev, breaks with real data." |
| SSR caching | `force-dynamic` on all authenticated pages | Prevents Next.js from caching authenticated pages with stale auth data. Applied to every page under `(dashboard)/` and the interview page. |

---

## 2. Shared Contracts

All types are defined upfront in `src/types/` before any feature is built. Every feature codes against these contracts.

### 2.1 TypeScript Types (`src/types/index.ts`)

```typescript
// ── Enums ──────────────────────────────────────────────
export type AppRole = 'owner' | 'admin' | 'team_member';

export type LeadStatus =
  | 'new'
  | 'under_review'
  | 'contacted'
  | 'demo_scheduled'
  | 'onboarding'
  | 'active_client'
  | 'closed_lost';

export type RequestDecision = 'approved' | 'denied';

export type LeadEmailStatus = 'sent' | 'delivered' | 'bounced' | 'failed' | 'complained';

// ── Core Entities ──────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole extends Profile {
  role: AppRole;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  industry: string | null;
  team_size: string | null;
  pain_points: string[];
  current_tools: string | null;
  goals: string | null;
  source: string | null;
  interview_transcript: ChatMessage[] | null;
  interview_data: InterviewData | null;
  status: LeadStatus;
  assigned_to: string | null;
  position: number;
  stage_entered_at: string;
  is_complete: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  assigned_profile?: Profile;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string;
  content: string;
  created_at: string;
  // Joined
  author?: Profile;
}

export interface LeadEmail {
  id: string;
  lead_id: string;
  sender_id: string;
  to_email: string;
  subject: string;
  body: string;
  resend_id: string | null;
  status: LeadEmailStatus;
  created_at: string;
  // Joined
  sender?: Profile;
}

export interface StatusRequest {
  id: string;
  lead_id: string;
  requester_id: string;
  current_status: LeadStatus;
  requested_status: LeadStatus;
  note: string;
  decision: RequestDecision | null;
  decided_by: string | null;
  created_at: string;
  decided_at: string | null;
  // Joined
  requester?: Profile;
  decider?: Profile;
  lead?: Pick<Lead, 'id' | 'name' | 'email' | 'business_name'>;
}

export interface ActivityLogEntry {
  id: string;
  entity_type: string; // 'lead' | 'note' | 'email' | 'status_request'
  entity_id: string;
  user_id: string | null;
  action: string; // 'created' | 'updated' | 'deleted' | 'status_changed' | 'assigned' | 'email_sent' | 'note_added' | 'request_submitted' | 'request_decided'
  metadata: Record<string, unknown>;
  created_at: string;
  // Joined
  user?: Profile;
}

export interface Invitation {
  id: string;
  email: string;
  role: AppRole;
  invited_by: string;
  token: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

// ── Interview-specific ─────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface InterviewData {
  business_name: string;
  industry: string;
  business_model: string;
  team_size: string;
  pain_points: string[];
  current_tools: string;
  goals: string;
  referral_source: string;
  additional_notes: string;
}

// ── Interview Session ──────────────────────────────────

export interface InterviewSession {
  leadId: string;
  nonce: string; // Crypto nonce generated at gate time, validated on subsequent calls
}

// ── Server Action Response ─────────────────────────────

export interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

// ── Auth Context ───────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: AppRole;
}

// ── Pagination ─────────────────────────────────────────

export interface PaginationParams {
  page: number;  // 1-based
  limit: number; // default 25
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### 2.2 Zod Validation Schemas (`src/types/schemas.ts`)

```typescript
import { z } from 'zod';

export const leadStatusEnum = z.enum([
  'new', 'under_review', 'contacted', 'demo_scheduled',
  'onboarding', 'active_client', 'closed_lost',
]);

export const appRoleEnum = z.enum(['owner', 'admin', 'team_member']);

export const leadEmailStatusEnum = z.enum(['sent', 'delivered', 'bounced', 'failed', 'complained']);

// Gate form before interview — includes honeypot field
export const interviewGateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  website: z.string().max(0, 'Bot detected'), // Honeypot — must be empty
});

// AI extraction output
export const interviewExtractionSchema = z.object({
  business_name: z.string().default(''),
  industry: z.string().default(''),
  business_model: z.string().default(''),
  team_size: z.string().default(''),
  pain_points: z.array(z.string()).default([]),
  current_tools: z.string().default(''),
  goals: z.string().default(''),
  referral_source: z.string().default(''),
  additional_notes: z.string().default(''),
});

// Fallback form (same fields) — includes honeypot field
export const fallbackFormSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  business_name: z.string().min(1),
  industry: z.string().min(1),
  team_size: z.string().min(1),
  pain_points: z.string().min(1), // Free text, split to array server-side
  current_tools: z.string().optional(),
  goals: z.string().min(1),
  referral_source: z.string().optional(),
  website: z.string().max(0, 'Bot detected'), // Honeypot — must be empty
});

// Lead mutations
export const updateLeadStatusSchema = z.object({
  lead_id: z.string().uuid(),
  status: leadStatusEnum,
});

export const assignLeadSchema = z.object({
  lead_id: z.string().uuid(),
  assigned_to: z.string().uuid().nullable(),
});

export const moveLeadInPipelineSchema = z.object({
  lead_id: z.string().uuid(),
  status: leadStatusEnum,
  position: z.number().int().nonnegative(),
});

// Notes
export const createNoteSchema = z.object({
  lead_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

// Emails
export const sendEmailSchema = z.object({
  lead_id: z.string().uuid(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
});

// Status requests
export const createStatusRequestSchema = z.object({
  lead_id: z.string().uuid(),
  requested_status: leadStatusEnum,
  note: z.string().min(1).max(2000),
});

export const decideStatusRequestSchema = z.object({
  request_id: z.string().uuid(),
  decision: z.enum(['approved', 'denied']),
});

// Invitations
export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'team_member']), // Cannot invite another owner
});

// Accept invite
export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1).max(100),
});

// Pagination
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});
```

### 2.3 Server Action Signatures

Every Server Action returns `Promise<ActionResult<T>>`. Never throws.

```typescript
// src/lib/actions/leads.ts
export async function updateLeadStatus(data: z.infer<typeof updateLeadStatusSchema>): Promise<ActionResult>
export async function assignLead(data: z.infer<typeof assignLeadSchema>): Promise<ActionResult>
export async function moveLeadInPipeline(data: z.infer<typeof moveLeadInPipelineSchema>): Promise<ActionResult>
export async function softDeleteLead(leadId: string): Promise<ActionResult>

// src/lib/actions/notes.ts
export async function createNote(data: z.infer<typeof createNoteSchema>): Promise<ActionResult<LeadNote>>

// src/lib/actions/emails.ts
export async function sendLeadEmail(data: z.infer<typeof sendEmailSchema>): Promise<ActionResult<LeadEmail>>

// src/lib/actions/status-requests.ts
export async function createStatusRequest(data: z.infer<typeof createStatusRequestSchema>): Promise<ActionResult<StatusRequest>>
export async function decideStatusRequest(data: z.infer<typeof decideStatusRequestSchema>): Promise<ActionResult>

// src/lib/actions/team.ts
export async function inviteTeamMember(data: z.infer<typeof createInvitationSchema>): Promise<ActionResult>
export async function changeTeamMemberRole(userId: string, newRole: AppRole): Promise<ActionResult>
export async function removeTeamMember(userId: string): Promise<ActionResult>

// src/lib/actions/interview.ts
export async function createPartialLead(name: string, email: string): Promise<ActionResult<{ leadId: string; nonce: string }>>
export async function saveInterviewTranscript(leadId: string, nonce: string, messages: ChatMessage[]): Promise<ActionResult>
export async function completeInterview(leadId: string, nonce: string, messages: ChatMessage[]): Promise<ActionResult>
export async function submitFallbackForm(data: z.infer<typeof fallbackFormSchema>): Promise<ActionResult>

// src/lib/actions/auth.ts
export async function acceptInvitation(data: z.infer<typeof acceptInviteSchema>): Promise<ActionResult>
```

---

## 3. Database Schema

All migrations run through Supabase. Listed in execution order.

### Migration 001: Enums

```sql
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'team_member');

CREATE TYPE public.lead_status AS ENUM (
  'new', 'under_review', 'contacted', 'demo_scheduled',
  'onboarding', 'active_client', 'closed_lost'
);

CREATE TYPE public.lead_email_status AS ENUM (
  'sent', 'delivered', 'bounced', 'failed', 'complained'
);
```

### Migration 002: Core Tables

```sql
-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles
-- NOTE: The UNIQUE constraint on user_id also serves as the index for the
-- custom_access_token_hook lookup. Do not remove UNIQUE without adding an
-- explicit index on user_id.
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  role public.app_role NOT NULL DEFAULT 'team_member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_name TEXT,
  industry TEXT,
  team_size TEXT,
  pain_points TEXT[] DEFAULT '{}',
  current_tools TEXT,
  goals TEXT,
  source TEXT, -- Populated from interview_data.referral_source on completion, or 'form' for fallback submissions
  interview_transcript JSONB,
  interview_data JSONB,
  interview_nonce TEXT, -- Crypto nonce for session validation on public interview actions
  interview_message_count INTEGER NOT NULL DEFAULT 0, -- Track messages for per-lead cap
  status public.lead_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_complete BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead notes
CREATE TABLE public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead emails — uses enum for status, includes 'complained' per Resend event types
CREATE TABLE public.lead_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  resend_id TEXT,
  status public.lead_email_status NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Status change requests
CREATE TABLE public.status_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_status public.lead_status NOT NULL,
  requested_status public.lead_status NOT NULL,
  note TEXT NOT NULL,
  decision TEXT CHECK (decision IN ('approved', 'denied')),
  decided_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);

-- Activity log (polymorphic)
-- NOTE: entity_id has no FK because it references multiple tables (polymorphic design).
-- This is a known trade-off. Orphaned entries are possible if notes/emails are cascade-deleted
-- with a lead. Consider a periodic cleanup function if the table grows large.
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'lead', 'note', 'email', 'status_request'
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invitations
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role public.app_role NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Migration 003: Indexes

```sql
-- Leads
CREATE INDEX idx_leads_status ON public.leads(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_active ON public.leads(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_status_position ON public.leads(status, position) WHERE deleted_at IS NULL;

-- Lead notes
CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes(lead_id);

-- Lead emails
CREATE INDEX idx_lead_emails_lead_id ON public.lead_emails(lead_id);

-- Status requests
CREATE INDEX idx_status_requests_pending ON public.status_requests(created_at DESC) WHERE decision IS NULL;
CREATE INDEX idx_status_requests_lead_id ON public.status_requests(lead_id);

-- Activity log
CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- Invitations
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);
```

### Migration 004: Helper Functions

```sql
-- Get current user's role from JWT
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role AS $$
  SELECT (auth.jwt() ->> 'user_role')::public.app_role;
$$ LANGUAGE sql STABLE;

-- Check if current user is owner or admin
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('owner', 'admin');
$$ LANGUAGE sql STABLE;

-- Check if current user is owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() = 'owner';
$$ LANGUAGE sql STABLE;

-- Custom Access Token Hook: injects user_role into JWT claims
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB LANGUAGE plpgsql STABLE AS $$
DECLARE
  claims JSONB;
  user_role public.app_role;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = (event->>'user_id')::UUID;

  claims := event->'claims';
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  ELSE
    claims := jsonb_set(claims, '{user_role}', 'null'::jsonb);
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Grant necessary permissions for the hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON public.user_roles TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
```

### Migration 005: Auto-Updated Timestamps + Profile Trigger

```sql
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile AND default team_member role on auth.users insert.
-- The invite flow and owner setup simply UPDATE the role to the correct value.
-- This prevents "null role" edge cases where a user exists but has no user_roles row.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'team_member');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Migration 006: Audit Trigger

```sql
-- Generic audit log trigger function.
-- IMPORTANT: Never stores full row data (PII protection). For generic updates,
-- stores only the names of changed fields. For specific actions (status_changed,
-- assigned, request_decided), stores only the relevant field values.
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
DECLARE
  _entity_type TEXT;
  _action TEXT;
  _metadata JSONB;
  _user_id UUID;
  _changed_fields TEXT[];
  _key TEXT;
BEGIN
  _entity_type := TG_ARGV[0]; -- Passed as trigger argument
  _user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    _action := 'created';
    _metadata := jsonb_build_object('entity_type', _entity_type);
    INSERT INTO public.activity_log (entity_type, entity_id, user_id, action, metadata)
    VALUES (_entity_type, NEW.id, _user_id, _action, _metadata);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Detect specific actions based on changed fields
    IF _entity_type = 'lead' AND OLD.status IS DISTINCT FROM NEW.status THEN
      _action := 'status_changed';
      _metadata := jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status);
    ELSIF _entity_type = 'lead' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      _action := 'assigned';
      _metadata := jsonb_build_object('old_assigned', OLD.assigned_to, 'new_assigned', NEW.assigned_to);
    ELSIF _entity_type = 'status_request' AND OLD.decision IS DISTINCT FROM NEW.decision THEN
      _action := 'request_decided';
      _metadata := jsonb_build_object('decision', NEW.decision, 'request_id', NEW.id);
    ELSE
      -- Generic update: store only changed field NAMES, not values (PII safe)
      _action := 'updated';
      _changed_fields := ARRAY[]::TEXT[];
      FOR _key IN SELECT jsonb_object_keys(to_jsonb(NEW))
      LOOP
        IF to_jsonb(NEW) -> _key IS DISTINCT FROM to_jsonb(OLD) -> _key THEN
          _changed_fields := _changed_fields || _key;
        END IF;
      END LOOP;
      _metadata := jsonb_build_object('changed_fields', to_jsonb(_changed_fields));
    END IF;
    INSERT INTO public.activity_log (entity_type, entity_id, user_id, action, metadata)
    VALUES (_entity_type, NEW.id, _user_id, _action, _metadata);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'deleted';
    _metadata := jsonb_build_object('entity_type', _entity_type);
    INSERT INTO public.activity_log (entity_type, entity_id, user_id, action, metadata)
    VALUES (_entity_type, OLD.id, _user_id, _action, _metadata);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to tables
CREATE TRIGGER audit_leads
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_activity('lead');

CREATE TRIGGER audit_lead_notes
  AFTER INSERT OR DELETE ON public.lead_notes
  FOR EACH ROW EXECUTE FUNCTION public.log_activity('note');

CREATE TRIGGER audit_lead_emails
  AFTER INSERT ON public.lead_emails
  FOR EACH ROW EXECUTE FUNCTION public.log_activity('email');

CREATE TRIGGER audit_status_requests
  AFTER INSERT OR UPDATE ON public.status_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_activity('status_request');
```

---

## 4. RLS Policies

### Migration 007: Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- ── profiles ───────────────────────────────────────────
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- ── user_roles ─────────────────────────────────────────
-- SPLIT policies (no FOR ALL) to avoid INSERT/USING ambiguity per Supabase recommendations.
CREATE POLICY "Authenticated users can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Owner can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "Owner can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_owner());

CREATE POLICY "Owner can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_owner());

-- ── leads ──────────────────────────────────────────────
CREATE POLICY "Admin/Owner can view all active leads"
  ON public.leads FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_admin_or_owner()
      OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "Admin/Owner can insert leads"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner());

CREATE POLICY "Admin/Owner can update leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner());

-- Note: Leads are also inserted via service_role from the interview endpoint (bypasses RLS).
-- The service_role client is only used in interview.ts Server Actions, scoped to:
-- 1. createPartialLead — inserts a new lead with is_complete=false
-- 2. saveInterviewTranscript — updates transcript on existing incomplete lead (validated by nonce)
-- 3. completeInterview — marks lead complete, updates structured data (validated by nonce)
-- All three actions validate the lead exists, is incomplete, and the nonce matches.

-- ── lead_notes ─────────────────────────────────────────
CREATE POLICY "Users can view notes on accessible leads"
  ON public.lead_notes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_notes.lead_id
        AND deleted_at IS NULL
        AND (public.is_admin_or_owner() OR leads.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Users can add notes to accessible leads"
  ON public.lead_notes FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_notes.lead_id
        AND deleted_at IS NULL
        AND (public.is_admin_or_owner() OR leads.assigned_to = auth.uid())
    )
  );

-- ── lead_emails ────────────────────────────────────────
CREATE POLICY "Admin/Owner can view lead emails"
  ON public.lead_emails FOR SELECT TO authenticated
  USING (public.is_admin_or_owner());

CREATE POLICY "Admin/Owner can send emails"
  ON public.lead_emails FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner() AND sender_id = auth.uid());

-- ── status_requests ────────────────────────────────────
CREATE POLICY "Admin/Owner can view all requests"
  ON public.status_requests FOR SELECT TO authenticated
  USING (
    public.is_admin_or_owner()
    OR requester_id = auth.uid()
  );

CREATE POLICY "Team members can create requests"
  ON public.status_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Admin/Owner can decide requests"
  ON public.status_requests FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner());

-- ── activity_log ───────────────────────────────────────
CREATE POLICY "Users can view activity on accessible entities"
  ON public.activity_log FOR SELECT TO authenticated
  USING (
    public.is_admin_or_owner()
    OR (
      entity_type = 'lead'
      AND EXISTS (
        SELECT 1 FROM public.leads
        WHERE leads.id = activity_log.entity_id
          AND leads.assigned_to = auth.uid()
      )
    )
  );

-- Insert handled by trigger (SECURITY DEFINER)

-- ── invitations ────────────────────────────────────────
CREATE POLICY "Owner can view invitations"
  ON public.invitations FOR SELECT TO authenticated
  USING (public.is_owner());

CREATE POLICY "Owner can insert invitations"
  ON public.invitations FOR INSERT TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "Owner can update invitations"
  ON public.invitations FOR UPDATE TO authenticated
  USING (public.is_owner());

CREATE POLICY "Owner can delete invitations"
  ON public.invitations FOR DELETE TO authenticated
  USING (public.is_owner());
```

---

## 5. File Structure

Files to create (new) or modify (existing). Organized by feature area.

```
src/
├── app/
│   ├── layout.tsx                          # MODIFY — add UserProvider, force light mode on dashboard routes
│   ├── page.tsx                            # MODIFY — update CTA hrefs to /interview
│   ├── providers.tsx                       # MODIFY — add Supabase auth provider
│   ├── globals.css                         # MODIFY — add dashboard-specific CSS vars
│   │
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx                    # NEW — login form
│   │   ├── accept-invite/
│   │   │   └── page.tsx                    # NEW — accept invitation + create account
│   │   ├── deactivated/
│   │   │   └── page.tsx                    # NEW — "Your account has been deactivated" page
│   │   └── callback/
│   │       └── route.ts                    # NEW — auth callback handler
│   │
│   ├── interview/
│   │   ├── page.tsx                        # NEW — AI chat interview page
│   │   └── error.tsx                       # NEW — interview error boundary (offers form fallback)
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                      # NEW — dashboard layout (sidebar, auth guard, light mode)
│   │   ├── error.tsx                       # NEW — dashboard error boundary
│   │   ├── dashboard/
│   │   │   ├── page.tsx                    # NEW — analytics (admin/owner) or lead overview (team)
│   │   │   └── loading.tsx                 # NEW — skeleton loading state
│   │   ├── leads/
│   │   │   ├── page.tsx                    # NEW — leads list with search/filter
│   │   │   ├── loading.tsx                 # NEW — skeleton loading state
│   │   │   └── [id]/
│   │   │       ├── page.tsx                # NEW — lead detail (tabs: overview, notes, emails, activity)
│   │   │       └── loading.tsx             # NEW — skeleton loading state
│   │   ├── pipeline/
│   │   │   ├── page.tsx                    # NEW — kanban board
│   │   │   └── loading.tsx                 # NEW — skeleton loading state
│   │   ├── requests/
│   │   │   ├── page.tsx                    # NEW — status change request queue
│   │   │   └── loading.tsx                 # NEW — skeleton loading state
│   │   ├── team/
│   │   │   ├── page.tsx                    # NEW — team management (owner only)
│   │   │   └── loading.tsx                 # NEW — skeleton loading state
│   │   └── settings/
│   │       └── page.tsx                    # NEW — account settings (owner only, minimal)
│   │
│   ├── api/
│   │   ├── interview/
│   │   │   └── route.ts                    # NEW — streaming Claude chat endpoint (Edge Runtime)
│   │   └── webhooks/
│   │       └── resend/
│   │           └── route.ts                # NEW — Resend delivery webhook
│   │
│   └── error.tsx                           # NEW — global error boundary
│
├── components/
│   ├── landing/                            # EXISTING — do not modify
│   ├── ui/                                 # MODIFY — add shared UI components
│   │   ├── button.tsx                      # NEW — button with CVA variants
│   │   ├── input.tsx                       # NEW — form input
│   │   ├── textarea.tsx                    # NEW — form textarea
│   │   ├── select.tsx                      # NEW — form select
│   │   ├── badge.tsx                       # NEW — status/role badges
│   │   ├── card.tsx                        # NEW — border-based card (no rounded corners)
│   │   ├── table.tsx                       # NEW — data table
│   │   ├── pagination.tsx                  # NEW — pagination controls
│   │   ├── dialog.tsx                      # NEW — modal dialog (Radix)
│   │   ├── dropdown-menu.tsx               # NEW — dropdown menu (Radix)
│   │   ├── tabs.tsx                        # NEW — tabs (Radix)
│   │   ├── avatar.tsx                      # NEW — user avatar (rounded-full)
│   │   ├── toast.tsx                       # NEW — toast notifications
│   │   ├── empty-state.tsx                 # NEW — empty state placeholder
│   │   └── loading.tsx                     # NEW — skeleton loading states
│   ├── dashboard/
│   │   ├── sidebar.tsx                     # NEW — dashboard sidebar navigation
│   │   ├── top-bar.tsx                     # NEW — top bar with user info
│   │   ├── role-gate.tsx                   # NEW — conditional render by role
│   │   ├── kpi-card.tsx                    # NEW — analytics KPI card
│   │   ├── activity-timeline.tsx           # NEW — activity feed timeline
│   │   ├── lead-table.tsx                  # NEW — leads data table
│   │   ├── lead-detail-header.tsx          # NEW — lead detail page header
│   │   ├── lead-overview.tsx               # NEW — structured interview data display
│   │   ├── lead-notes.tsx                  # NEW — notes list + add form
│   │   ├── lead-emails.tsx                 # NEW — emails list + compose form
│   │   ├── lead-filters.tsx               # NEW — search + filter controls
│   │   ├── status-badge.tsx                # NEW — pipeline status badge with color
│   │   ├── status-request-form.tsx         # NEW — request status change form
│   │   ├── status-request-card.tsx         # NEW — request card for admin queue
│   │   ├── pipeline-board.tsx              # NEW — kanban board container
│   │   ├── pipeline-column.tsx             # NEW — kanban column
│   │   ├── pipeline-card.tsx               # NEW — draggable lead card
│   │   ├── team-table.tsx                  # NEW — team members table
│   │   ├── invite-form.tsx                 # NEW — invite team member form
│   │   ├── analytics-charts.tsx            # NEW — chart components (funnel, line, bar, pie)
│   │   └── team-leaderboard.tsx            # NEW — team performance table
│   └── interview/
│       ├── chat-interface.tsx              # NEW — chat UI (messages + input)
│       ├── chat-message.tsx                # NEW — single message bubble
│       ├── interview-gate.tsx              # NEW — name/email form gate (with honeypot)
│       ├── fallback-form.tsx               # NEW — static fallback form (with honeypot)
│       └── interview-complete.tsx          # NEW — thank you screen
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       # NEW — createBrowserClient factory
│   │   ├── server.ts                       # NEW — createServerClient factory
│   │   ├── middleware.ts                   # NEW — auth middleware logic
│   │   └── admin.ts                        # NEW — service_role client (server-only)
│   ├── actions/
│   │   ├── leads.ts                        # NEW — lead Server Actions
│   │   ├── notes.ts                        # NEW — note Server Actions
│   │   ├── emails.ts                       # NEW — email Server Actions
│   │   ├── status-requests.ts              # NEW — status request Server Actions
│   │   ├── team.ts                         # NEW — team management Server Actions
│   │   ├── interview.ts                    # NEW — interview Server Actions
│   │   └── auth.ts                         # NEW — auth Server Actions
│   ├── queries/
│   │   ├── leads.ts                        # NEW — lead data fetching (server-side, paginated)
│   │   ├── analytics.ts                    # NEW — analytics aggregation queries
│   │   ├── activity.ts                     # NEW — activity log queries (paginated)
│   │   └── team.ts                         # NEW — team data queries
│   ├── email/
│   │   ├── resend.ts                       # NEW — Resend client instance
│   │   ├── send.ts                         # NEW — email sending helpers
│   │   └── templates/
│   │       ├── lead-confirmation.tsx        # NEW — prospect confirmation email
│   │       ├── new-lead-notification.tsx    # NEW — admin notification email
│   │       ├── status-request.tsx           # NEW — status request notification
│   │       ├── status-decision.tsx          # NEW — request decision notification
│   │       └── team-invitation.tsx          # NEW — invitation email
│   ├── interview/
│   │   ├── system-prompt.ts                # NEW — Claude system prompt for interview
│   │   └── extract.ts                      # NEW — Zod extraction from transcript
│   ├── rate-limit.ts                       # NEW — IP-based rate limiter for public endpoints
│   ├── utils.ts                            # EXISTING — add more utilities
│   └── constants.ts                        # NEW — pipeline stages, role labels, etc.
│
├── types/
│   ├── index.ts                            # NEW — all shared TypeScript types
│   ├── schemas.ts                          # NEW — all Zod validation schemas
│   └── database.ts                         # NEW — Supabase generated types
│
├── hooks/
│   ├── use-mobile.ts                       # EXISTING
│   ├── use-user.ts                         # NEW — auth user context hook
│   ├── use-realtime-leads.ts               # NEW — Supabase realtime subscription
│   └── use-toast.ts                        # NEW — toast notification hook
│
├── middleware.ts                            # NEW — Next.js middleware (auth token refresh + role validation + route protection)
│
└── .env.local                              # NEW — environment variables (not committed)
```

**Total new files: ~85** (added loading.tsx per route, error.tsx per group, deactivated page, pagination, rate-limit)
**Modified files: ~5** (layout.tsx, page.tsx, providers.tsx, globals.css, utils.ts)

---

## 6. Implementation Phases

### Phase 1: Foundation (Sequential — everything depends on this)

**Estimated effort: Large**

#### Step 1.1: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr ai @ai-sdk/anthropic @ai-sdk/react resend @react-email/components zod recharts @dnd-kit/react @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-select @radix-ui/react-avatar @radix-ui/react-popover
```

**Acceptance criteria**: `npm install` succeeds. `package.json` includes all new deps. `npm run build` produces zero warnings and zero errors.

#### Step 1.2: Environment Variables

Create `.env.local` with all required variables. Create `.env.example` (committed) with placeholder values.

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx
ANTHROPIC_API_KEY=sk-ant-xxxx
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=noreply@aush.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Acceptance criteria**: `.env.local` exists with real values. `.env.example` exists with placeholder values. `.gitignore` includes `.env.local`.

#### Step 1.3: Supabase Project Setup

- Create Supabase project (if not already done)
- Enable email/password auth provider
- Disable email confirmations for dev (optional)
- Note project URL and keys

**Acceptance criteria**: Supabase dashboard accessible. Auth provider configured. Keys available.

#### Step 1.4: Database Migrations

Execute migrations 001-007 (enums, tables, indexes, helper functions, timestamps, audit triggers, RLS policies) via Supabase SQL editor or MCP tool.

After migrations:
- Enable the Custom Access Token Hook in Supabase Dashboard > Auth > Hooks > point to `custom_access_token_hook`

**Acceptance criteria**: All tables visible in Supabase Table Editor. `\dt` shows all 7 tables. RLS enabled on all tables. Custom Access Token Hook configured. Test: insert a user_role row manually, decode the JWT via jwt.io or Supabase Auth debug endpoint, and confirm the `user_role` key exists with the correct value.

#### Step 1.5: Supabase Client Factories

Create `src/lib/supabase/client.ts`, `server.ts`, `admin.ts`.

```typescript
// client.ts — browser client
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// server.ts — server client (Server Components, Server Actions, Route Handlers)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

```typescript
// admin.ts — service_role client (server-only, bypasses RLS)
// IMPORTANT: Only used in interview.ts Server Actions for public lead creation/updates
// and in team.ts for admin user creation. Never import in client components.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

**Acceptance criteria**: All three files created. TypeScript compiles. Import from any Server Component works.

#### Step 1.6: Email Infrastructure (Resend Client + Templates)

> Moved from Phase 6 to Phase 1 because email sending is needed in Phase 3 (interview completion) and Phase 7 (team invitations).

Create `src/lib/email/resend.ts`:
- Instantiates Resend client with API key

Create `src/lib/email/send.ts`:
- `sendEmail(to, subject, react)` — wrapper around resend.emails.send()
- Handles errors gracefully, returns `{ success, error, resendId }`

Create 5 email templates in `src/lib/email/templates/`:

1. `lead-confirmation.tsx` — "Thanks for your interest in Aush! We've received your application and will be in touch."
2. `new-lead-notification.tsx` — "New lead: {name} from {business}. View in dashboard."
3. `status-request.tsx` — "Team member {name} has requested to change {lead} from {old} to {new}."
4. `status-decision.tsx` — "Your status change request for {lead} has been {approved/denied}."
5. `team-invitation.tsx` — "You've been invited to join AushCRM as {role}. Click to accept."

All templates: clean, professional, light background, no rounded corners, border-based layout.

**Acceptance criteria**: Resend client created. All 5 templates render correctly (test with React Email preview). Test email can be sent via `send.ts` helper. No TypeScript errors. Consistent branding.

#### Step 1.7: Rate Limiter

Create `src/lib/rate-limit.ts`:
- Simple in-memory rate limiter using a `Map<string, { count: number, resetAt: number }>`
- `rateLimit(key: string, limit: number, windowMs: number): { success: boolean, remaining: number }`
- Used by the interview API route and public Server Actions
- Key is typically the client IP address (from `headers().get('x-forwarded-for')`)
- Limits: 5 `createPartialLead` calls per IP per 10 minutes, 60 chat messages per IP per 10 minutes

**Acceptance criteria**: Rate limiter returns `{ success: false }` after limit exceeded. Counters reset after window expires.

#### Step 1.8: Auth Middleware

Create `src/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/leads') ||
    request.nextUrl.pathname.startsWith('/pipeline') ||
    request.nextUrl.pathname.startsWith('/requests') ||
    request.nextUrl.pathname.startsWith('/team') ||
    request.nextUrl.pathname.startsWith('/settings');

  // Redirect unauthenticated users from dashboard to login
  if (!user && isDashboardRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // For authenticated users on dashboard routes, check for valid role
  if (user && isDashboardRoute) {
    // Read user_role from the JWT claims (injected by custom_access_token_hook)
    const session = (await supabase.auth.getSession()).data.session;
    const userRole = session?.access_token
      ? JSON.parse(atob(session.access_token.split('.')[1]))?.user_role
      : null;

    if (!userRole || userRole === 'null') {
      // User exists but has no role — account deactivated / removed
      return NextResponse.redirect(new URL('/auth/deactivated', request.url));
    }
  }

  // Redirect authenticated users from login to dashboard
  if (user && request.nextUrl.pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

**Acceptance criteria**: Middleware runs on every navigation. Unauthenticated users redirected from dashboard routes. Authenticated users with null role redirected to `/auth/deactivated`. Authenticated users redirected from login. Tokens refreshed automatically.

#### Step 1.9: TypeScript Types + Zod Schemas

Create `src/types/index.ts` and `src/types/schemas.ts` as defined in Section 2. Generate `src/types/database.ts` from Supabase.

**Acceptance criteria**: `npx tsc --noEmit` passes. All types importable from `@/types`. All Zod schemas importable from `@/types/schemas`.

#### Step 1.10: Seed Data

Create a seed SQL script (`supabase/seed.sql`) that:
1. Creates the owner user in Supabase Auth via the Supabase dashboard (manually, since `auth.users` cannot be inserted to directly via SQL in hosted Supabase)
2. After the user is created via dashboard, run the SQL script that:
   - Verifies the profile row was auto-created by the trigger
   - Updates the user_roles row (auto-created as `team_member` by trigger) to `role = 'owner'`
   - Optionally creates a few test leads

Explicit steps for the user:
1. Go to Supabase Dashboard > Authentication > Users > Add User
2. Enter email and password for the owner
3. Copy the user UUID from the dashboard
4. Run: `UPDATE public.user_roles SET role = 'owner' WHERE user_id = '<UUID>';`
5. Verify: decode the JWT and confirm `user_role: 'owner'`

**Acceptance criteria**: Owner can log in. JWT decoded via jwt.io shows `user_role: 'owner'`. Profile exists in profiles table. user_roles row has `role = 'owner'`.

---

### Phase 2: Auth Pages + Dashboard Shell (Sequential)

**Estimated effort: Medium**

#### Step 2.1: Shared UI Components (Foundation Set)

Create the core UI components needed across all dashboard pages:
- `button.tsx` — primary, secondary, ghost, destructive variants. CVA-based. Sharp corners (rounded-sm max).
- `input.tsx` — form input with label support. Sharp corners.
- `textarea.tsx` — multiline input.
- `badge.tsx` — status badges, role badges. Sharp corners (rounded-full for pills).
- `card.tsx` — border-based card. `border border-gray-200 bg-white`. No rounded corners. No shadows.
- `avatar.tsx` — rounded-full user avatar with fallback initials.
- `toast.tsx` — notification toasts (success, error, info).
- `loading.tsx` — skeleton loading placeholders.
- `empty-state.tsx` — empty state with icon, message, CTA.
- `pagination.tsx` — page navigation controls (prev/next, page numbers, items-per-page).

**Acceptance criteria**: All components render correctly. No TypeScript errors. Consistent with design system (no rounded corners on containers, border-based, 8px grid).

#### Step 2.2: Login Page

Create `/auth/login/page.tsx`:
- Email + password form
- "Sign In" button
- Error display for invalid credentials
- No "Sign Up" link (invite-only system)
- Clean, centered layout. Light mode.

Server Action: calls `supabase.auth.signInWithPassword()`. On success, redirect to `/dashboard`.

**Acceptance criteria**: Login form renders. Valid credentials log in and redirect to dashboard. Invalid credentials show error. No way to create an account from this page.

#### Step 2.3: Deactivated Account Page

Create `/auth/deactivated/page.tsx`:
- Message: "Your account has been deactivated. Contact your administrator for assistance."
- Link to landing page
- No dashboard nav, no sidebar

**Acceptance criteria**: Page renders with clear message. No dashboard access from this page.

#### Step 2.4: Auth Callback Route

Create `/auth/callback/route.ts`:
- Handles the PKCE code exchange after email confirmation / password reset
- Exchanges code for session, redirects to dashboard

**Acceptance criteria**: Auth callback works for password reset flow (future use). No errors on load.

#### Step 2.5: Dashboard Layout

Create `src/app/(dashboard)/layout.tsx`:
- Server Component
- `export const dynamic = 'force-dynamic'` — prevents caching with stale auth data
- Calls `supabase.auth.getUser()` — if no user, redirect to login
- Fetches user profile + role from profiles + user_roles tables
- Forces light mode (adds `class="light"` or removes dark class)
- Renders `<Sidebar>` + `<TopBar>` + `<main>{children}</main>`
- Wraps children in `<UserProvider>` context

Create `src/app/(dashboard)/error.tsx`:
- Dashboard-specific error boundary
- Shows "Something went wrong" with retry button
- Preserves sidebar layout

Create route-level `loading.tsx` files for each major route segment:
- `src/app/(dashboard)/dashboard/loading.tsx`
- `src/app/(dashboard)/leads/loading.tsx`
- `src/app/(dashboard)/leads/[id]/loading.tsx`
- `src/app/(dashboard)/pipeline/loading.tsx`
- `src/app/(dashboard)/requests/loading.tsx`
- `src/app/(dashboard)/team/loading.tsx`

Each loading.tsx renders a simple skeleton layout appropriate to its page.

Create `src/components/dashboard/sidebar.tsx`:
- Vertical nav with icon + text items
- Links vary by role (see Phase description above)
- Active state on current route
- Collapsible on mobile (hamburger menu)
- Border-right separator, white background

Create `src/components/dashboard/top-bar.tsx`:
- Page title (dynamic based on route)
- User avatar + name + role badge
- Sign out button

Create `src/hooks/use-user.ts`:
- React Context + hook for accessing current user + role throughout dashboard

**Acceptance criteria**: Dashboard layout renders with sidebar and top bar. Navigation links work. Role-based nav items shown/hidden correctly. Sidebar hidden behind hamburger menu at < 768px (mobile). User context available in all dashboard pages. `npx tsc --noEmit` passes. Light mode forced. Loading states show skeleton while navigating between pages.

#### Step 2.6: Constants File

Create `src/lib/constants.ts`:
- `PIPELINE_STAGES` array with labels, colors, order
- `ROLE_LABELS` map
- `STATUS_COLORS` map
- Navigation items per role

**Acceptance criteria**: Constants importable. Used by sidebar and status badges.

#### Step 2.7: Empty Dashboard Page

Create `src/app/(dashboard)/dashboard/page.tsx`:
- `export const dynamic = 'force-dynamic'`
- Placeholder content: "Welcome to AushCRM" + user name
- Will be replaced with analytics in Phase 8

Create `src/app/interview/error.tsx`:
- Interview-specific error boundary
- Shows error message + "Switch to form" CTA

**Acceptance criteria**: After login, user sees the dashboard page with welcome message. Full auth flow works end to end: login → middleware → layout → page.

---

### Phase 3: AI Chat Interview (Parallel with Phase 4 + 7)

**Estimated effort: Large**

**Prerequisites**: Phase 1 (including Step 1.6 email infrastructure and Step 1.7 rate limiter)

#### Step 3.1: Interview Page Shell

Create `src/app/interview/page.tsx`:
- Public page (no auth required)
- `export const dynamic = 'force-dynamic'`
- Light mode
- Three states: gate (name/email) → chat → complete
- State managed via useState

**Acceptance criteria**: Page renders. Shows gate form by default. No auth required.

#### Step 3.2: Interview Gate Component

Create `src/components/interview/interview-gate.tsx`:
- Name + email form
- Honeypot field: hidden `website` input (CSS `display: none`, labeled "Leave this empty"). If filled, silently reject.
- Validates with `interviewGateSchema`
- On submit: calls `createPartialLead` Server Action → receives `{ leadId, nonce }` → stores both in state → transitions to chat state
- "Prefer to fill out a form?" link → transitions to fallback form state

**Acceptance criteria**: Form validates inputs. Honeypot rejects bots silently. Creates partial lead in DB on submit. Returns nonce for session validation. Transitions to chat. Rate limited to 5 creates per IP per 10 minutes.

#### Step 3.3: Chat Interface

Create `src/components/interview/chat-interface.tsx`:
- Uses `useChat()` from `@ai-sdk/react` with `DefaultChatTransport` from `ai` for endpoint/body config
- Transport: `new DefaultChatTransport({ api: '/api/interview', body: { leadId, nonce } })`
- Uses `sendMessage(content)` to send (not `handleSubmit` — removed in AI SDK v5)
- Manual `useState` for input field (not `input`/`handleInputChange` — removed in v5)
- Uses `status` field (not `isLoading` — removed in v5) for streaming indicator
- Messages list with auto-scroll
- Input field + send button
- Streaming indicator while `status === 'streaming'`
- "Switch to form" link
- Max turns detection (after ~12 AI messages, auto-trigger completion)

Create `src/components/interview/chat-message.tsx`:
- Single message bubble
- User messages right-aligned, AI messages left-aligned
- No rounded corners on message containers (rounded-sm max)
- Markdown rendering for AI messages

**Acceptance criteria**: Chat sends messages to API. Responses stream in real-time. Messages display correctly. Auto-scrolls. Streaming indicator visible. Nonce passed with every request.

#### Step 3.4: Interview API Route (Edge Runtime)

Create `src/app/api/interview/route.ts`:
- `export const runtime = 'edge'` — Edge Runtime to avoid Vercel Hobby 10s timeout
- POST handler
- **Rate limiting**: 60 messages per IP per 10 minutes (use Edge-compatible rate limiter or `@vercel/edge` if needed — note: the in-memory rate limiter from Step 1.7 does not work on Edge. Use a simple edge-compatible approach: validate per-lead message count from DB instead.)
- **Nonce validation**: Fetch the lead by `leadId`, verify `is_complete = false` and `interview_nonce` matches the provided nonce
- **Per-lead message cap**: Reject if `interview_message_count >= 20`
- **Origin check**: Verify the `Origin` header matches `NEXT_PUBLIC_APP_URL` (CSRF protection for public endpoint)
- Receives messages array + leadId + nonce
- Uses `streamText()` from `ai` with `anthropic('claude-sonnet-4-20250514')`
- System prompt from `src/lib/interview/system-prompt.ts`
- After every response, increment `interview_message_count` and save updated transcript to leads table (via service_role client)
- Returns `result.toUIMessageStreamResponse()`

Create `src/lib/interview/system-prompt.ts`:
- Detailed system prompt that:
  - Introduces AI as Aush's intake assistant
  - Lists the questions to ask (adaptive, not rigid checklist)
  - Defines guardrails (stay on topic, redirect off-topic, be professional)
  - Instructs AI to ask 5-8 questions total, then summarize
  - Includes instructions for handling edge cases (vague answers, hostile users, non-English)

**Acceptance criteria**: API returns streaming responses on Edge Runtime (no 10s timeout). System prompt tested with 5 mock conversations covering: ideal lead, vague answers, off-topic user, hostile user, non-English speaker. Guardrails prevent off-topic conversation. Transcript saved to DB after each exchange. Nonce validated. Message cap enforced at 20 per lead. Origin header checked. Invalid/completed leads rejected.

#### Step 3.5: Lead Extraction + Completion

Create `src/lib/interview/extract.ts`:
- Takes conversation messages array
- Calls Claude with `generateText()` + `Output.object({ schema: interviewExtractionSchema })` (not `generateObject()` — deprecated in AI SDK v5)
- Accesses extracted data via `result.output` (not `result.object`)
- Returns structured `InterviewData`
- Fallback: if extraction fails or `result.output` is null, return partial data with defaults

Create `src/lib/actions/interview.ts`:
- `createPartialLead(name, email)`:
  - **Rate limited**: 5 per IP per 10 minutes
  - **Honeypot validated**: gate schema includes website field
  - Generates a crypto nonce (`crypto.randomUUID()`)
  - Inserts lead via service_role client with `is_complete = false`, `interview_nonce = nonce`, `source = 'interview'`
  - Returns `{ leadId, nonce }`
- `saveInterviewTranscript(leadId, nonce, messages)`:
  - Validates: lead exists, `is_complete = false`, `interview_nonce` matches
  - Updates transcript via service_role client
- `completeInterview(leadId, nonce, messages)`:
  - Validates: lead exists, `is_complete = false`, `interview_nonce` matches
  - Calls extraction function
  - Updates lead with structured data, sets `is_complete = true`, sets `source` from `interview_data.referral_source` (defaults to 'interview' if empty)
  - Sends confirmation email to prospect via Resend (uses templates from Step 1.6)
  - Sends notification email to admins via Resend (uses templates from Step 1.6)
  - Returns success
- `submitFallbackForm(data)`:
  - **Rate limited**: 5 per IP per 10 minutes
  - **Honeypot validated**
  - Creates complete lead with `source = 'form'`
  - Sends same confirmation/notification emails

**Acceptance criteria**: After conversation ends, lead record has structured data. `is_complete = true`. `source` field populated. Confirmation email sent to prospect. Notification sent to admins. If extraction fails, raw transcript is saved and lead is flagged. Nonce validation prevents unauthorized mutations. Rate limiting prevents spam.

#### Step 3.6: Fallback Static Form

Create `src/components/interview/fallback-form.tsx`:
- Form with all interview fields (name, email, phone, business_name, industry, team_size, pain_points, current_tools, goals, referral_source)
- Hidden honeypot `website` field (same as gate)
- Validates with `fallbackFormSchema`
- On submit: calls `submitFallbackForm` Server Action
- Shows completion screen on success

**Acceptance criteria**: Form renders all fields. Validates input. Honeypot rejects bots. Creates complete lead record with `source = 'form'`. Sends same confirmation/notification emails as chat flow.

#### Step 3.7: Interview Complete Screen

Create `src/components/interview/interview-complete.tsx`:
- Thank you message
- "We'll be in touch" text
- Link back to landing page

**Acceptance criteria**: Shows after interview or form completion. Clean, professional design.

#### Step 3.8: Update Landing Page CTAs

Modify CTA buttons in existing landing page components to link to `/interview` instead of `#get-started`.

**Acceptance criteria**: All "Get Started" buttons navigate to `/interview`. No existing animations or layout broken. Visual regression test passes.

---

### Phase 4: Lead Management (Parallel with Phase 3 + 7)

**Estimated effort: Large**

#### Step 4.1: Lead Data Queries (Paginated)

Create `src/lib/queries/leads.ts`:
- `getLeads(filters?, pagination?)` — fetches leads with optional status/assignee/search filters. Uses `.range()` for pagination. Returns `PaginatedResult<Lead>`. Joins `assigned_profile`.
- `getLead(id)` — fetches single lead with notes, emails, activity. Joins all related data.
- `getLeadNotes(leadId, pagination?)` — fetches notes with author profile. Paginated.
- `getLeadEmails(leadId, pagination?)` — fetches emails with sender profile. Paginated.
- `getLeadActivity(leadId, pagination?)` — fetches activity log entries with user profile. Paginated.

All queries use the server Supabase client (RLS enforced).

**Acceptance criteria**: Queries return correct data with pagination metadata. RLS filters apply (team members only see assigned leads). TypeScript types match return shapes. Default page size is 25.

#### Step 4.2: Lead Server Actions

Create `src/lib/actions/leads.ts`:
- `updateLeadStatus` — validates with Zod, updates status + stage_entered_at, returns result
- `assignLead` — validates, updates assigned_to, returns result
- `moveLeadInPipeline` — validates, updates status + position, **re-indexes all cards in the destination column** (see Position Management below)
- `softDeleteLead` — sets deleted_at = now()

**Position Management Strategy (Full Re-index)**:
When a lead is moved (via kanban drag or status change):
1. Begin a Supabase transaction (or use `.rpc()`)
2. Update the moved lead's `status` and `position`
3. Select all leads in the destination column (same status, `deleted_at IS NULL`), ordered by current position
4. Re-assign positions as 0, 1, 2, 3... for all cards in that column
5. If the source column changed, also re-index the source column to remove gaps

This is wrapped in a single `.rpc()` call for atomicity.

All actions: validate input with Zod, check auth via `getUser()`, perform mutation, return `ActionResult`.

**Acceptance criteria**: Actions validate input. Unauthorized calls return error. Successful calls update DB. Activity log entries created via trigger. Position re-index produces sequential integers with no gaps. Concurrent moves handled by Postgres row-level locking.

#### Step 4.3: Leads List Page (Paginated)

Create `src/app/(dashboard)/leads/page.tsx`:
- Server Component
- `export const dynamic = 'force-dynamic'`
- Reads `page` and `limit` from searchParams
- Fetches leads via `getLeads(filters, { page, limit })`
- Renders `<LeadTable>` with `<LeadFilters>` and `<Pagination>`

Create `src/components/dashboard/lead-table.tsx`:
- Table with columns: Name, Email, Business, Status, Assigned To, Created
- Status shown as colored badge
- Assigned To shown as avatar + name
- Rows clickable → navigate to `/leads/[id]`
- Sortable columns (client-side for MVP)

Create `src/components/dashboard/lead-filters.tsx`:
- Search input (filters by name/email/business)
- Status dropdown filter
- Assigned To dropdown filter (admin/owner only)
- Clear filters button

**Acceptance criteria**: Table renders leads for current page. Pagination controls navigate between pages. Filters work. Status badges colored correctly. Clicking row navigates to detail page. Team members see only their leads. Empty state shown when no leads.

#### Step 4.4: Lead Detail Page — Overview

Create `src/app/(dashboard)/leads/[id]/page.tsx`:
- Server Component
- `export const dynamic = 'force-dynamic'`
- Fetches lead + notes + emails + activity via queries
- Header: name, email, business, status badge, assigned to, created date
- Actions: assign (admin/owner), change status (admin/owner), request change (team member), delete (admin/owner)
- Tabs: Overview, Notes, Emails (admin/owner), Activity

Create `src/components/dashboard/lead-detail-header.tsx`:
- Lead name, email, phone
- Status badge with dropdown to change (admin/owner)
- Assign dropdown (admin/owner)
- "Request Status Change" button (team member)

Create `src/components/dashboard/lead-overview.tsx`:
- Displays structured interview data in a clean layout
- Business name, industry, team size, pain points, current tools, goals, source
- If interview_data is null, shows raw transcript or "Incomplete" notice

**Acceptance criteria**: Detail page loads with all lead data. Tabs switch content. Overview shows structured data. Role-appropriate actions visible. Team members see no edit controls (only request button).

#### Step 4.5: Notes System

Create `src/lib/actions/notes.ts`:
- `createNote` — validates, inserts, returns new note with author profile

Create `src/components/dashboard/lead-notes.tsx`:
- List of notes (newest first) with author avatar, name, timestamp, content
- Paginated (load more / pagination at bottom)
- "Add Note" form at bottom (textarea + submit button)
- Submits via `createNote` Server Action
- Optimistic update or revalidation after submit

**Acceptance criteria**: Notes display in order. New note appears after submit. Author info shown correctly. Team members can add notes to their assigned leads only. Pagination works for leads with many notes.

#### Step 4.6: Activity Timeline (Paginated)

Create `src/lib/queries/activity.ts`:
- `getLeadActivity(leadId, pagination?)` — fetches activity_log for entity_type='lead' + entity_id=leadId, ordered by created_at DESC. Paginated.
- `getRecentActivity(pagination?)` — for the dashboard analytics page

Create `src/components/dashboard/activity-timeline.tsx`:
- Vertical timeline with icons per action type
- Shows: user avatar, action description, timestamp
- Action descriptions: "changed status from X to Y", "assigned to User", "added a note", "sent an email", etc.
- Metadata parsed for human-readable descriptions (note: metadata contains field names only for generic updates, not PII values)
- "Load more" button for pagination

**Acceptance criteria**: Timeline shows all actions on the lead in chronological order. Different icons per action type. Descriptions are readable. Empty state when no activity. Pagination loads older entries.

---

### Phase 5: Pipeline + Status Requests (After Phase 4)

**Estimated effort: Large**

#### Step 5.1: Kanban Board

Create `src/app/(dashboard)/pipeline/page.tsx`:
- Server Component fetches all leads grouped by status
- `export const dynamic = 'force-dynamic'`
- Passes to client-side `<PipelineBoard>`
- Role gate: admin/owner only. Team members redirected.

Create `src/components/dashboard/pipeline-board.tsx`:
- Client Component ("use client")
- Uses `@dnd-kit/react` DragDropProvider
- 7 columns, one per pipeline stage
- Manages local state for optimistic updates
- On drag end: update local state → call `moveLeadInPipeline` Server Action → if fails, revert
- `moveLeadInPipeline` triggers full re-index of destination column (and source column if different)

Create `src/components/dashboard/pipeline-column.tsx`:
- Droppable zone for a pipeline stage
- Header: stage name + lead count
- Scrollable list of cards
- Color-coded header bar per stage

Create `src/components/dashboard/pipeline-card.tsx`:
- Draggable lead card
- Shows: name, business, assigned avatar, days in stage
- Click navigates to lead detail

**Acceptance criteria**: Board renders 7 columns with correct leads. Drag between columns changes status and position. Drag within column reorders. Positions persist after page refresh (verify by reloading and checking order is preserved). Optimistic update is instant. Failed updates revert. Pipeline page only accessible to admin/owner. Full re-index produces gap-free sequential positions.

#### Step 5.2: Realtime Subscription

Create `src/hooks/use-realtime-leads.ts`:
- Subscribes to `postgres_changes` on leads table
- On INSERT/UPDATE/DELETE: updates local leads state
- Used by PipelineBoard to stay in sync

**Acceptance criteria**: When another user changes a lead (e.g., via lead detail page), the kanban board updates without refresh. Subscription cleans up on unmount.

#### Step 5.3: Status Request Form

Create `src/components/dashboard/status-request-form.tsx`:
- Dialog/modal triggered from lead detail page (team member only)
- Fields: new status (dropdown), note (textarea, required)
- Validates with `createStatusRequestSchema`
- Calls `createStatusRequest` Server Action

Create `src/lib/actions/status-requests.ts`:
- `createStatusRequest` — validates, inserts row, sends notification email to admins (uses templates from Step 1.6)
- `decideStatusRequest` — validates, **checks for stale request** (compares `request.current_status` against the lead's actual current status — if they differ, marks request as "stale" and returns error to admin: "This lead's status has changed since the request was submitted. The request is no longer valid."), then if not stale: updates decision + decided_by + decided_at, if approved updates lead status, sends decision notification email to requester

**Acceptance criteria**: Team member can open request form. Form validates. Creates request row. Admins receive notification email. Request appears in admin queue. Stale requests (where lead status changed between request and decision) are detected and rejected with a clear message instead of silently overwriting.

#### Step 5.4: Requests Queue Page

Create `src/app/(dashboard)/requests/page.tsx`:
- Server Component fetches pending requests (decision IS NULL)
- `export const dynamic = 'force-dynamic'`
- For admin/owner: shows all pending requests
- For team member: shows their own requests (pending + decided)

Create `src/components/dashboard/status-request-card.tsx`:
- Card showing: lead name, requester, current status → requested status, note, date
- Admin/Owner: "Approve" and "Deny" buttons
- Team member: status badge (pending/approved/denied)

**Acceptance criteria**: Pending requests display for admin/owner. Approve/deny works. Stale requests show clear error. Lead status updates on approval. Team members see their own request history. Empty state when no requests.

---

### Phase 6: Email Compose + Webhook (After Phase 4)

> Email infrastructure (client + templates) moved to Phase 1, Step 1.6. This phase now only contains the compose-from-dashboard feature, the webhook, and the notification wiring.

**Estimated effort: Small-Medium**

#### Step 6.1: Email Compose on Lead Detail

Create `src/components/dashboard/lead-emails.tsx`:
- List of sent emails (subject, date, status badge)
- "Compose Email" button (admin/owner only)
- Compose form: subject + body (plain text)
- Calls `sendLeadEmail` Server Action

Create `src/lib/actions/emails.ts`:
- `sendLeadEmail` — validates, sends via Resend, inserts `lead_emails` row, returns result

**Acceptance criteria**: Admin/Owner can compose and send email from lead detail. Email delivered via Resend. Record saved in lead_emails table with correct `lead_email_status` enum value. Appears in email list.

#### Step 6.2: Resend Webhook

Create `src/app/api/webhooks/resend/route.ts`:
- POST handler
- Validates webhook signature
- Updates `lead_emails.status` based on event type (delivered, bounced, complained, etc.)

**Acceptance criteria**: Webhook receives Resend events. Email status updates in DB. Invalid signatures rejected.

#### Step 6.3: Notification Email Wiring

Wire up notification emails in existing Server Actions (if not already wired in their respective phases):
- `completeInterview` → sends `lead-confirmation` to prospect + `new-lead-notification` to all admins (done in Phase 3)
- `createStatusRequest` → sends `status-request` to all admins (done in Phase 5)
- `decideStatusRequest` → sends `status-decision` to requester (done in Phase 5)

Query to get admin emails: `SELECT email FROM profiles JOIN user_roles ON ... WHERE role IN ('owner', 'admin')`

**Acceptance criteria**: All 4 notification triggers send correct emails. Emails arrive with correct content. Failures logged but don't block the main action.

---

### Phase 7: Team Management (Parallel with Phase 3 + 4)

**Estimated effort: Medium**

**Prerequisites**: Phase 1 (including Step 1.6 email infrastructure for invitation emails)

#### Step 7.1: Team Data Queries

Create `src/lib/queries/team.ts`:
- `getTeamMembers()` — fetches all profiles with roles
- `getInvitations()` — fetches all invitations (pending + accepted)

**Acceptance criteria**: Queries return correct data. TypeScript types match.

#### Step 7.2: Team List Page

Create `src/app/(dashboard)/team/page.tsx`:
- Server Component, owner only (redirect others)
- `export const dynamic = 'force-dynamic'`
- Fetches team members + invitations

Create `src/components/dashboard/team-table.tsx`:
- Table: name, email, role, joined date
- Role dropdown to change role (cannot change own role, cannot change to owner)
- "Remove" button

Create `src/components/dashboard/invite-form.tsx`:
- Email input + role select (admin or team_member)
- "Send Invitation" button

**Acceptance criteria**: Owner sees all team members. Can change roles. Can remove members. Can send invitations. Non-owner users cannot access this page.

#### Step 7.3: Team Server Actions

Create `src/lib/actions/team.ts`:
- `inviteTeamMember`:
  - Validates (owner only)
  - **Checks for existing unexpired invitations** for the same email. If found, revokes the old one (sets `accepted_at = now()` as a soft-cancel) and creates a new one.
  - Creates invitation row
  - Sends invitation email via Resend (uses template from Step 1.6)
- `changeTeamMemberRole` — validates (owner only), updates user_roles
- `removeTeamMember`:
  - Validates (owner only, cannot remove self)
  - Deletes user_role row
  - **Also disables the user in Supabase Auth** via admin API (`supabase.auth.admin.updateUserById(userId, { ban_duration: 'none' })` — or equivalent to prevent login)
  - User is blocked from dashboard by middleware (null role check) AND cannot log in

**Acceptance criteria**: Invitation creates row + sends email. Re-inviting an existing email revokes old invitation and sends new one. Role change updates JWT on next refresh. Removal blocks dashboard access and disables auth. Removed user redirected to `/auth/deactivated`.

#### Step 7.4: Accept Invitation Page

Create `src/app/auth/accept-invite/page.tsx`:
- Reads `token` from query params
- Validates token (not expired, not accepted)
- Shows form: full name + password
- On submit: calls `acceptInvitation` Server Action
  - Creates Supabase Auth user (via admin client)
  - Profile and default `team_member` role auto-created by trigger
  - Updates user_role row to match the invited role
  - Marks invitation as accepted
  - Signs in the new user
  - Redirects to dashboard

**Acceptance criteria**: Invitation link works. Account created with correct role. User logged in and redirected. Expired/used tokens show error. Email locked to invitation email.

---

### Phase 8: Analytics Dashboard (After all feature phases)

**Estimated effort: Medium**

#### Step 8.1: Analytics Queries

Create `src/lib/queries/analytics.ts`:
- `getKPIs()` — total leads, new this week, conversion rate, avg days to close
- `getLeadsByStage()` — COUNT grouped by status (for funnel)
- `getLeadsOverTime(period)` — COUNT grouped by week/month (for line chart)
- `getAvgTimePerStage()` — AVG days in each stage (for bar chart)
- `getTeamLeaderboard()` — leads per team member with conversion counts
- `getLeadsBySource()` — COUNT grouped by source (for pie chart). Source is populated from `interview_data.referral_source` or 'form'/'interview' default.
- `getPendingRequestsCount()` — COUNT of undecided status requests
- `getRecentActivity(limit)` — latest activity log entries

All queries use raw SQL via Supabase `.rpc()` or inline `.select()` with aggregation.

**Acceptance criteria**: All queries return correct aggregated data. Each query logged with timing. Any query > 500ms triggers an EXPLAIN ANALYZE review and index optimization. TypeScript types for return shapes.

#### Step 8.2: Chart Components

Create `src/components/dashboard/analytics-charts.tsx`:
- `FunnelChart` — horizontal bar chart showing leads per stage with drop-off percentages
- `LeadsOverTimeChart` — line chart with date axis
- `TimePerStageChart` — bar chart showing avg days per stage
- `LeadsBySourceChart` — pie/donut chart

All charts: Recharts library. Light mode colors. No rounded corners on chart containers. Border-based card wrappers.

**Acceptance criteria**: All 4 charts render with real data. Responsive. Tooltips work. Colors match design system.

#### Step 8.3: Team Leaderboard

Create `src/components/dashboard/team-leaderboard.tsx`:
- Table: team member name, leads assigned, leads converted, conversion rate
- Sorted by leads converted (descending)

**Acceptance criteria**: Leaderboard shows all team members with accurate stats. Sortable.

#### Step 8.4: Dashboard Page Assembly

Update `src/app/(dashboard)/dashboard/page.tsx`:

**Admin/Owner view**:
- Row 1: 4 KPI cards (total, new, conversion rate, avg close time)
- Row 2: Funnel chart (left) + Leads over time (right)
- Row 3: Time per stage (left) + Leads by source (right)
- Row 4: Team leaderboard (left) + Pending requests count + Recent activity (right)

**Team member view**:
- Row 1: 3 KPI cards (my leads, my pending requests, latest update)
- Row 2: Table of their assigned leads
- Row 3: Their recent activity

Create `src/components/dashboard/kpi-card.tsx`:
- Label, value, optional trend indicator
- Border-based card, no rounded corners

**Acceptance criteria**: Admin/owner sees full analytics dashboard with all charts and data. Team member sees simplified personal dashboard. All data accurate. Responsive layout. Loading skeletons while data loads.

---

## 7. Parallelization Map

```
Phase 1: Foundation ──────────────────────────────── (SEQUENTIAL, do first)
    │    (includes email infra, rate limiter, auth middleware)
    │
Phase 2: Auth + Dashboard Shell ──────────────────── (SEQUENTIAL, needs Phase 1)
    │    (includes error boundaries, loading states, deactivated page)
    │
    ├── Phase 3: AI Interview ────────────────────── (PARALLEL, email ready from Phase 1)
    ├── Phase 4: Lead Management ─────────────────── (PARALLEL)
    └── Phase 7: Team Management ─────────────────── (PARALLEL, email ready from Phase 1)
              │
              ├── Phase 5: Pipeline + Status Requests (PARALLEL, needs Phase 4)
              └── Phase 6: Email Compose + Webhook ── (PARALLEL, needs Phase 4)
                        │
                Phase 8: Analytics ────────────────── (LAST, needs all data)
```

**Within phases**, further parallelization:
- Phase 3: Steps 3.1-3.3 (UI) can parallel with 3.4 (API route) since they have defined contracts
- Phase 4: Steps 4.1-4.2 (queries/actions) can parallel with 4.3 (table component)
- Phase 5: Step 5.1 (kanban) can parallel with 5.3-5.4 (status requests)
- Phase 6: Step 6.1 (compose UI) can parallel with 6.2 (webhook)

---

## 8. Edge Cases

| Scenario | Handling |
|---|---|
| Visitor closes chat mid-interview | Partial lead saved with `is_complete = false`. Transcript saved up to that point. Lead appears in dashboard as "Incomplete". |
| Visitor goes off-topic in chat | System prompt instructs Claude to redirect. If 3+ off-topic messages, offer to switch to form. |
| Visitor submits form with minimal info | Lead created with available fields. Marked as complete but with sparse data. Admin reviews. |
| Same email submits multiple times | Allow duplicate leads. Add `is_duplicate` flag or show warning badge in dashboard. Admin decides to merge or keep. |
| Bot spams the interview endpoint | Honeypot field rejects naive bots. IP-based rate limit (5 creates / 10min, 60 messages / 10min). Per-lead message cap (20). Nonce validation prevents unauthorized mutations. |
| Team member accesses unassigned lead URL | RLS blocks the query. Page shows "Lead not found" (don't reveal existence). |
| Admin accesses owner-only page (/team) | Server-side role check in page component. Redirect to /dashboard. |
| Removed user tries to access dashboard | Middleware detects null role in JWT, redirects to `/auth/deactivated`. Auth also disabled via admin API. |
| Multiple admins drag same lead simultaneously | Optimistic update on both clients. Last write wins in DB. Full re-index ensures position consistency. Realtime subscription reconciles both boards. Activity log shows both changes. |
| Resend email fails to send | `sendEmail` returns error. Lead email record created with status = 'failed'. UI shows retry button. Main action (e.g., interview completion) is not blocked. |
| Claude API fails mid-conversation | Show error toast: "Something went wrong. Try again or switch to the form." Chat state preserved so user can retry. |
| Claude API times out | Edge Runtime has no hard timeout for streaming. Show timeout-specific error if stream stalls. Offer form fallback. |
| Invitation token expired | Accept invite page validates. Shows "This invitation has expired. Contact your admin for a new one." |
| Invitation email already has account | Show "An account with this email already exists. Please log in instead." with link to login. |
| Re-invite same email | Old unexpired invitation revoked, new one created and sent. |
| Status request becomes stale | `decideStatusRequest` compares `request.current_status` to lead's actual status. If mismatched, returns "stale" error. Admin must review manually. |
| RLS policy blocks legitimate action | Return clear error message. Log server-side for debugging. Never expose raw Supabase errors to client. |
| Empty pipeline stages | Column renders with "No leads" empty state. Still accepts drops. |
| Very long interview transcript | Limit chat to 20 messages (server-enforced cap). Extraction handles arbitrary length. DB column is JSONB (no size limit in practice). |
| User changes role while logged in | JWT updates on next token refresh (middleware handles this). Force refresh after role change via `refreshSession()`. |
| Lead source tracking | `source` field set to 'interview' for AI chat completions (overridden by `interview_data.referral_source` if present), 'form' for fallback form submissions. Used in "Leads by Source" analytics. |

---

## 9. Error Handling Strategy

### Pattern: Server Action Response

Every Server Action returns `ActionResult<T>`:
```typescript
interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}
```

Never throw from Server Actions. Catch all errors, log server-side, return user-friendly message.

### Pattern: Query Error Handling

```typescript
const { data, error } = await supabase.from('leads').select('*');
if (error) {
  console.error('Failed to fetch leads:', error);
  return []; // or throw for error boundary
}
return data;
```

### Pattern: Client Error Display

- Toast for action results (success/error)
- Inline error messages for form validation (Zod)
- Error boundary (error.tsx) for unexpected crashes
- Empty state components for missing data

### Error Boundaries

- `src/app/error.tsx` — global error boundary (shows "Something went wrong" + retry button)
- `src/app/(dashboard)/error.tsx` — dashboard-specific error boundary (preserves sidebar layout)
- `src/app/interview/error.tsx` — interview error boundary (offers form fallback)

### Logging

- Server-side: `console.error()` with structured context (Vercel captures these)
- No client-side error logging service for MVP (add Sentry later if needed)

### CSRF Protection

- **Authenticated Server Actions**: Next.js 14.2.35's built-in Server Action CSRF protection is active by default (origin header checking). This is a security assumption documented here — do not disable it with custom headers.
- **Public interview actions**: Additionally validate the `Origin` header matches `NEXT_PUBLIC_APP_URL` since these bypass auth. Reject requests with mismatched or missing origin.

---

## 10. Testing Strategy

### After Every Phase

1. `npx tsc --noEmit` — zero TypeScript errors
2. `npm run lint` — clean output
3. `npm run build` — successful production build, zero warnings

### Phase-Specific Testing

| Phase | Manual Tests | Automated Checks |
|---|---|---|
| Phase 1 | Verify tables in Supabase. Test seed login. Check JWT has role (decode via jwt.io). Test email delivery via send.ts helper. Verify rate limiter blocks after limit. | `tsc`, `build` |
| Phase 2 | Login flow. Dashboard renders. Sidebar nav. Mobile responsive (hamburger at < 768px). Removed user redirected to deactivated page. Loading skeletons appear during navigation. | `tsc`, `build`, Playwright: login → dashboard |
| Phase 3 | Full interview flow. Fallback form. Partial save on abandon. CTA links. Honeypot blocks bot. Rate limit blocks spam. Nonce validation rejects tampered requests. Origin check blocks cross-origin. | `tsc`, `build`, Playwright: interview end-to-end |
| Phase 4 | Lead list renders with pagination. Filters work. Detail page shows data. Notes CRUD. Activity timeline with load-more. | `tsc`, `build`, Playwright: lead CRUD |
| Phase 5 | Kanban drag between columns. Positions persist after refresh. Realtime sync (two browser tabs). Status request submit/approve/deny. Stale request detection works. | `tsc`, `build`, Playwright: drag-and-drop, request flow |
| Phase 6 | Send email from dashboard. Check Resend dashboard for delivery. Webhook updates status. Status uses enum values. | `tsc`, `build`, send test emails |
| Phase 7 | Invite flow end-to-end. Accept invite. Change role. Remove member → user redirected to deactivated. Re-invite same email works. | `tsc`, `build`, Playwright: invite → accept → login |
| Phase 8 | All charts render with data. KPIs accurate. Leaderboard correct. Responsive. Query timing < 500ms. | `tsc`, `build`, visual screenshot comparison |

### Role-Based Access Testing (After Phase 5)

Test matrix — log in as each role and verify:

| Action | Owner | Admin | Team Member |
|---|---|---|---|
| See all leads | YES | YES | NO (only assigned) |
| See lead detail (assigned) | YES | YES | YES |
| See lead detail (unassigned) | YES | YES | NO (404) |
| Change lead status directly | YES | YES | NO |
| Request status change | N/A | N/A | YES |
| Approve/deny request | YES | YES | NO |
| Add note | YES | YES | YES (own leads) |
| Send email | YES | YES | NO |
| View pipeline | YES | YES | NO (redirect) |
| View analytics | YES | YES | NO (simplified) |
| Manage team | YES | NO (redirect) | NO (redirect) |
| Invite members | YES | NO | NO |
| Removed user (null role) | DEACTIVATED | DEACTIVATED | DEACTIVATED |

### Visual Testing

After each phase, use Chrome DevTools / Playwright to verify:
- No rounded corners on containers/cards
- Border-based design (no shadows on cards)
- 8px spacing grid alignment
- Light mode in dashboard
- Responsive on mobile (375px), tablet (768px), desktop (1280px)
- No visual regressions on landing page

---

## 11. Risks and Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Custom Access Token Hook bug breaks all auth | Low | Critical | Test in isolation first. Include COALESCE null fallback. Verify JWT in Supabase dashboard before building UI. Decode JWT via jwt.io. |
| 2 | AI interview asks repetitive/irrelevant questions | Medium | High | Detailed system prompt with explicit question flow. Test with 5 mock conversations (ideal lead, vague, off-topic, hostile, non-English). Include max_turns limit (20 messages). Iterate on prompt. |
| 3 | Zod extraction fails on unusual transcripts | Medium | Medium | Extraction function has fallback: save raw transcript, mark lead for manual review. All Zod fields have `.default()`. |
| 4 | dnd-kit API is different from expected | Low | Medium | Verify API with Context7 before coding. Pin exact version. Write thin abstraction layer. |
| 5 | Resend free tier rate limit (100/day) | Medium | Low | Batch notifications. Avoid duplicate sends. Track daily count. Upgrade plan before production. |
| 6 | RLS policies misconfigured — data leak or access block | Medium | High | Write explicit test queries for each role in Supabase SQL editor. Test matrix after Phase 5. Separate RLS policies per operation (no FOR ALL). |
| 7 | Stale JWT after role change | Medium | Medium | Call `refreshSession()` after role change. Document that changes take effect on next page load. |
| 8 | Landing page broken by CTA changes | Low | Medium | Only change `href` values. No structural or animation changes. Visual regression test. |
| 9 | Vercel Hobby plan timeout on AI calls | Low (mitigated) | High | Use Edge Runtime (`export const runtime = 'edge'`) for the interview API route. Edge Functions have no timeout for streaming. No dependency on Vercel Pro plan. |
| 10 | Concurrent pipeline moves cause inconsistency | Low | Low | Full re-index strategy + Postgres row-level locking. Optimistic update + realtime reconciliation. Activity log tracks all changes. |
| 11 | Email delivery issues (SPF/DKIM not configured) | Medium | Medium | Use Resend's default sending domain for dev. Configure custom domain before production. Verify with test emails. |
| 12 | Large transcript causes slow page loads | Low | Low | Paginate activity log. Lazy-load transcript. JSONB queries are fast for single-row reads. |
| 13 | Public interview endpoint abuse (spam/billing) | Medium | High | IP-based rate limiting (5 creates/10min, 60 messages/10min). Honeypot fields on forms. Nonce-based session validation. Per-lead message cap (20). Origin header checking. |
| 14 | PII in audit log creates compliance risk | Low (mitigated) | High | Audit trigger stores only changed field names for generic updates, not values. Specific actions store only relevant metadata (old_status, new_status, etc.). Never stores full row data or transcripts. |

---

## Dependencies to Install (Complete List)

```bash
# Core infrastructure
npm install @supabase/supabase-js @supabase/ssr zod

# AI chat
npm install ai @ai-sdk/anthropic @ai-sdk/react

# Email
npm install resend @react-email/components

# Kanban DnD
npm install @dnd-kit/react

# Charts
npm install recharts

# UI primitives (Radix)
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-select @radix-ui/react-avatar @radix-ui/react-popover
```

**Total new dependencies: 16** (including recharts)

---

## Summary

- **8 phases**, 3 of which can run in parallel
- **~85 new files**, ~5 modified files
- **7 database tables** + 3 enums + split RLS policies + PII-safe audit triggers
- **16 new dependencies**
- **5 email templates** (built in Phase 1, available to all phases)
- **1 AI system prompt** to iterate on
- Foundation (Phase 1-2) is the critical path — everything else depends on it
- Biggest risks: auth hook correctness, AI interview quality, RLS policy accuracy, public endpoint abuse
- Every subtask has clear, measurable acceptance criteria and is independently verifiable

---

## 12. Revision Log

All changes below address issues from the staff engineer adversarial review (dated 2026-03-31).

### Critical Issues Addressed

| Issue | Change | Section |
|---|---|---|
| **C1. Interview API has no rate limiting** | Added IP-based rate limiter (Step 1.7), honeypot fields on gate + fallback forms, per-lead message cap (20) stored in `interview_message_count` column, nonce-based session validation via `interview_nonce` column, origin header checking. Rate limits: 5 creates/10min, 60 messages/10min per IP. | Steps 1.7, 3.2, 3.4, 3.5, 3.6; Schema §3 (leads table); Shared Contracts §2 |
| **C2. Unauthenticated service_role usage** | Interview actions now generate a crypto nonce at gate time, stored in the lead row. All subsequent actions (`saveInterviewTranscript`, `completeInterview`) validate leadId exists, `is_complete = false`, and nonce matches before any mutation. service_role usage documented explicitly in RLS comments and admin.ts. | Steps 3.2, 3.4, 3.5; RLS §4 (leads comment); File structure (admin.ts comment) |
| **C3. Conflicting RLS on user_roles (FOR ALL)** | Split the `FOR ALL` policy into 4 separate policies: SELECT (all authenticated), INSERT (owner, WITH CHECK), UPDATE (owner, USING), DELETE (owner, USING). Follows Supabase recommendations against FOR ALL. | RLS §4 (user_roles section) |
| **C4. Full PII in audit log** | Rewrote `log_activity()` trigger. INSERT/DELETE now store only `entity_type` (no row data). Generic UPDATE stores only changed field *names* (not values). Specific actions (status_changed, assigned, request_decided) store only their relevant metadata fields. Full row data (to_jsonb(NEW/OLD)) is never stored. | Schema §3 (Migration 006); Architecture Decisions table |

### Major Issues Addressed

| Issue | Change | Section |
|---|---|---|
| **M1. Vercel Hobby 10s timeout** | Interview API route now uses `export const runtime = 'edge'` (Edge Runtime) which has no timeout for streaming. Removed `maxDuration = 30`. Documented in Architecture Decisions. Note: in-memory rate limiter from Step 1.7 doesn't work on Edge, so rate limiting for the API route uses per-lead message count validation from DB instead. | Step 3.4; Architecture Decisions; Risk #9 |
| **M2. No kanban position strategy** | Defined full re-index strategy: on every move, re-assign positions as sequential integers (0, 1, 2...) for all cards in the destination column (and source column if different), wrapped in an `.rpc()` call for atomicity. Added `idx_leads_status_position` index. | Step 4.2; Step 5.1; Architecture Decisions; Indexes §3 |
| **M3. Removed users can still access dashboard** | Middleware now reads `user_role` from JWT claims after confirming user exists. If role is null, redirects to new `/auth/deactivated` page. `removeTeamMember` also disables the user via Supabase admin API. `handle_new_user` trigger now creates a default `team_member` role row, preventing null-role edge cases for new users. | Steps 1.8, 2.3, 7.3; Migration 005; Testing matrix |
| **M4. Missing force-dynamic** | Added `export const dynamic = 'force-dynamic'` to every page under `(dashboard)/` and the interview page. Documented as standard pattern in Architecture Decisions. | Steps 2.5, 2.7, 3.1, 4.3, 4.4, 5.1, 5.4, 7.2; Architecture Decisions |
| **M5. Stale status request race condition** | `decideStatusRequest` now compares `request.current_status` against the lead's actual current status before approving. If mismatched, returns "stale" error instead of overwriting. | Step 5.3; Edge Cases table |
| **M6. CSRF for public actions** | Documented that Next.js 14.2.35 built-in CSRF protection is active by default. Added explicit origin header check for public interview actions. Documented as security assumption in Error Handling Strategy. | Steps 3.4, 3.5; Error Handling §9; Architecture Decisions |
| **M7. No pagination** | Added `PaginationParams` and `PaginatedResult<T>` types. All list queries (`getLeads`, `getLeadNotes`, `getLeadEmails`, `getLeadActivity`) now accept pagination params and use `.range()`. Added `pagination.tsx` UI component. Leads list page reads page/limit from searchParams. Activity timeline has "load more" pagination. | Steps 4.1, 4.3, 4.5, 4.6; Shared Contracts §2; File Structure §5 |

### Dependency Ordering Fixed

| Issue | Change | Section |
|---|---|---|
| **D1. Email needed in Phase 3** | Moved Resend client setup + all 5 email templates from Phase 6 into Phase 1 (Step 1.6). Phase 3 and Phase 7 now have email infrastructure available. Phase 6 reduced to compose-from-dashboard + webhook + notification wiring verification. | Steps 1.6, 3.5, 5.3, 7.3; Phase 6 header; Parallelization Map §7 |
| **D2. Team invite needs email** | Same fix as D1 — email templates available from Phase 1. | Step 7.3; Parallelization Map §7 |

### Minor Issues Addressed

| Issue | Change | Section |
|---|---|---|
| **m1. lead_emails.status plain TEXT** | Created `lead_email_status` enum type ('sent', 'delivered', 'bounced', 'failed', 'complained'). `lead_emails.status` now uses this enum. Added to TypeScript types as `LeadEmailStatus`. | Migration 001, 002; Shared Contracts §2.1 |
| **m2. No index comment on user_roles.user_id** | Added comment in Migration 002 noting that the UNIQUE constraint also serves as the index for the access token hook. | Migration 002 |
| **m3. Orphaned activity_log entries** | Added comment in Migration 002 (activity_log table) documenting the polymorphic trade-off and suggesting periodic cleanup if the table grows large. | Migration 002 |
| **m4. Re-inviting same email not handled** | `inviteTeamMember` now checks for existing unexpired invitations. If found, revokes old one and creates new. | Step 7.3 |
| **m5. handle_new_user doesn't create user_roles** | Trigger now creates a default `team_member` user_roles row on every `auth.users` INSERT. Invite flow and owner setup update the role to the correct value. Prevents null-role edge cases. | Migration 005 |
| **m6. Missing dashboard error boundary** | Added `src/app/(dashboard)/error.tsx` and `src/app/interview/error.tsx` to file structure and Phase 2 implementation. | Steps 2.5, 2.7; File Structure §5 |
| **m7. No loading.tsx files** | Added `loading.tsx` for every major route segment: dashboard, leads, leads/[id], pipeline, requests, team. Created in Phase 2. | Step 2.5; File Structure §5 |
| **m8. Recharts missing from deps list** | Added `recharts` to the "Dependencies to Install (Complete List)" section. Updated count to 16. | Dependencies section |
| **m9. Owner account creation vague** | Added explicit step-by-step instructions: create user via Supabase dashboard, then run SQL to update role from default `team_member` to `owner`. | Step 1.10 |
| **m10. Source tracking unclear** | Defined: `source` populated from `interview_data.referral_source` on interview completion (defaults to 'interview' if empty), or 'form' for fallback submissions. Wired in `completeInterview` and `submitFallbackForm`. Documented in leads table schema comment. | Steps 3.5, 3.6; Schema §3 (leads table comment); Edge Cases; Step 8.1 |

### Acceptance Criteria Tightened

| Step | Old | New |
|---|---|---|
| 1.1 | "`npm run build` still passes" | "`npm run build` produces zero warnings and zero errors" |
| 1.4 | "verify JWT contains user_role claim" | "decode the JWT via jwt.io or Supabase Auth debug endpoint, and confirm the `user_role` key exists with the correct value" |
| 2.5 (was 2.4) | "Mobile sidebar collapses" | "Sidebar hidden behind hamburger menu at < 768px (mobile)" |
| 3.4 | "System prompt produces relevant qualifying questions" | "System prompt tested with 5 mock conversations covering: ideal lead, vague answers, off-topic user, hostile user, non-English speaker" |
| 5.1 | "Drag between columns changes status" | "Drag between columns changes status and position. Drag within column reorders. Positions persist after page refresh (verify by reloading and checking order is preserved)" |
| 8.1 | "Performance acceptable (< 500ms each)" | "Each query logged with timing. Any query > 500ms triggers an EXPLAIN ANALYZE review and index optimization" |

### Context7 Validation Pass (Phase 5)

| Library | Verdict | Change |
|---|---|---|
| @supabase/ssr | VERIFIED | No changes needed |
| @supabase/supabase-js | VERIFIED | No changes needed |
| @ai-sdk/anthropic | VERIFIED | No changes needed |
| @ai-sdk/react | **CORRECTED** | `useChat()` v5+ API: removed `input`/`handleInputChange`/`handleSubmit`/`isLoading`. Now uses `sendMessage()`, manual `useState` for input, `DefaultChatTransport` for endpoint config, `status` field for streaming state. Updated Step 3.3. |
| ai (Vercel AI SDK) | **CORRECTED** | `generateObject()` deprecated in v5. Replaced with `generateText()` + `Output.object({ schema })` in Step 3.5. Access extracted data via `result.output` (not `result.object`). |
| resend | VERIFIED | No changes needed |
| @react-email/components | VERIFIED | No changes needed |
| @dnd-kit/react | VERIFIED | No changes needed |
| next-themes | VERIFIED | No changes needed |
| zod | VERIFIED | No changes needed |
| recharts | VERIFIED | No changes needed |

### Architecture Observations (Unchanged, Reviewer Agreed)

1. No multi-tenancy is the right call.
2. Server Actions over API routes is the right call.
3. Recharts is a reasonable choice.
4. The shared contracts section is excellent.
5. The audit trigger approach is clean (now also PII-safe).

---

## 13. Plan Addendum (v2 — 2026-04-01)

All additions below were identified during a gap analysis session. These are scoped for v1.

### Addition A: In-App Notification System (Steps 5.5–5.7)

#### Database Changes

New enum in Migration 001:
```sql
CREATE TYPE public.notification_type AS ENUM (
  'new_lead', 'request_submitted', 'request_decided',
  'lead_assigned', 'lead_status_changed'
);
```

New table in Migration 002:
```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT NOT NULL, -- relative URL, e.g. /leads/uuid
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

New indexes in Migration 003:
```sql
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
```

New RLS in Migration 007:
```sql
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
```

Insert is handled server-side via service_role (same pattern as audit log trigger).

#### TypeScript Types (add to `src/types/index.ts`)

```typescript
export type NotificationType =
  | 'new_lead'
  | 'request_submitted'
  | 'request_decided'
  | 'lead_assigned'
  | 'lead_status_changed';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read_at: string | null;
  created_at: string;
}
```

#### Server Action Signatures (add to contracts)

```typescript
// src/lib/actions/notifications.ts
export async function markNotificationRead(notificationId: string): Promise<ActionResult>
export async function markAllNotificationsRead(): Promise<ActionResult>
```

#### Helper Function

```typescript
// src/lib/notifications/create.ts
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link: string
): Promise<void>

// Convenience: notify all admins + owner
export async function notifyAdmins(
  type: NotificationType,
  title: string,
  body: string,
  link: string
): Promise<void>
```

#### Trigger Points (called alongside existing email sends)

| Event | Recipients | Title | Link |
|---|---|---|---|
| New lead completes interview/form | All admins + owner | "New lead: {name} from {business}" | `/leads/{id}` |
| Team member requests status change | All admins + owner | "{requester} requested: {lead} → {status}" | `/requests` |
| Admin approves/denies request | The requester | "Your request for {lead} was {decision}" | `/leads/{id}` |
| Lead assigned to team member | The assignee | "You've been assigned: {lead}" | `/leads/{id}` |
| Lead status changed by admin | Assigned team member (if any) | "{lead} moved to {status}" | `/leads/{id}` |

#### New Files

```
src/lib/notifications/create.ts              # NEW — createNotification + notifyAdmins
src/lib/actions/notifications.ts             # NEW — markRead, markAllRead
src/lib/queries/notifications.ts             # NEW — getUnreadCount, getRecentNotifications
src/hooks/use-notifications.ts               # NEW — realtime subscription + unread count
src/components/dashboard/notification-bell.tsx    # NEW — bell icon + dropdown panel
src/components/dashboard/notification-item.tsx    # NEW — single notification row
```

#### UI Spec

- Bell icon in `top-bar.tsx` with unread count badge (red dot with number)
- Click opens dropdown panel: recent 20 notifications, newest first
- Each item: type icon, title, time ago, subtle background tint if unread
- Click notification → navigate to `link` + mark as read
- "Mark all as read" button at top of dropdown
- Realtime: Supabase `postgres_changes` on `notifications` where `user_id = current user`
- New notification → increment badge + show toast

#### Phase Placement

- **Step 5.5**: Create notifications table, types, RLS, helper function, server actions, queries
- **Step 5.6**: Wire `createNotification` calls into existing server actions (`completeInterview`, `submitFallbackForm`, `createStatusRequest`, `decideStatusRequest`, `assignLead`, `updateLeadStatus`)
- **Step 5.7**: Build notification bell UI, dropdown, realtime subscription, toast on new notification

---

### Addition B: Small Feature Additions

#### B1. Duplicate Lead Warning Badge

**Where:** Lead detail header + pipeline card + leads list table
**Logic:** On lead creation, check if `email` already exists in `leads` table (excluding soft-deleted). If match found, set a transient `is_duplicate` flag (computed, not stored — query-time check via a subquery or left join).
**UI:** Orange "Possible duplicate" badge linking to the other lead(s).
**Phase:** Add to Phase 4, Step 4.4 (lead detail) and Step 4.3 (leads list).

#### B2. Days-in-Stage Indicator

**Where:** Pipeline card, lead detail header
**Logic:** `Math.floor((now - stage_entered_at) / 86400000)` days. Yellow at ≥3 days, red at ≥7 days.
**UI:** Small text under the status badge: "5 days" with color coding.
**Phase:** Add to Phase 5, Step 5.1 (pipeline card) and Phase 4, Step 4.4 (lead detail).

#### B3. Demo Date Field

**Database:** Add `demo_date TIMESTAMPTZ` (nullable) to `leads` table.
**Type:** Add `demo_date: string | null` to `Lead` interface.
**UI:** When status = `demo_scheduled`, show date picker on lead detail. Display date on pipeline card.
**Phase:** Add to schema (Phase 1) and UI (Phase 4, Step 4.4).

#### B4. CSV Export

**Where:** "Export CSV" button on leads list page (admin/owner only)
**Logic:** Server action queries all leads matching current filters (no pagination limit), serializes to CSV, returns as downloadable blob.
**Phase:** Add to Phase 4, Step 4.3.

#### B5. Note Deletion

**Where:** Delete button on each note (visible only to author)
**Logic:** Author can delete their own note. Logged in audit trail.
**RLS:** Add DELETE policy on `lead_notes`: `USING (author_id = auth.uid())`.
**Server Action:** `deleteNote(noteId: string): Promise<ActionResult>` in `src/lib/actions/notes.ts`.
**Phase:** Add to Phase 4, Step 4.5.

#### B6. Forgot Password

**Where:** "Forgot password?" link on login page
**Logic:** Calls `supabase.auth.resetPasswordForEmail(email)`. Shows "Check your email" message. Auth callback route already handles the token exchange.
**Phase:** Add to Phase 2, Step 2.2.

#### B7. Show Archived Toggle

**Where:** Toggle/checkbox on leads list page (admin/owner only)
**Logic:** When enabled, query includes `deleted_at IS NOT NULL` leads. Archived leads shown with a muted/strikethrough style.
**RLS:** Requires a separate SELECT policy or modifying existing one to allow viewing deleted leads for admin/owner.
**Phase:** Add to Phase 4, Step 4.3.

---

### Addition C: Pre-Launch Checklist (Doc Only)

Create `docs/pre-launch-checklist.md` covering:
- [ ] Supabase project created (production)
- [ ] DNS: SPF/DKIM/DMARC configured for sending domain
- [ ] Resend: custom domain verified
- [ ] Environment variables set in Vercel
- [ ] Owner account created + role set
- [ ] Custom Access Token Hook enabled
- [ ] Test email delivery (check spam folder)
- [ ] Interview system prompt reviewed with 5 test conversations
- [ ] RLS test matrix passed for all 3 roles
- [ ] Vercel deployment successful

### Addition D: Ownership Transfer Doc (Doc Only)

Create `docs/ownership-transfer.md` with exact SQL:
```sql
-- Transfer ownership from old_owner to new_owner
UPDATE public.user_roles SET role = 'admin' WHERE user_id = '<old_owner_uuid>';
UPDATE public.user_roles SET role = 'owner' WHERE user_id = '<new_owner_uuid>';
-- Verify: both users sign out and back in to refresh JWT
```

---

### Updated File Count

- **New files added by addendum: ~8** (notification system) + ~2 (docs)
- **Revised total: ~95 new files, ~5 modified files**
- **Revised dependency count: 16** (unchanged — notifications use existing Supabase realtime)
