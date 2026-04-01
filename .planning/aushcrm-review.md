# AushCRM Implementation Plan -- Staff Engineer Review

**Reviewer**: Staff Engineer (Adversarial Review)
**Date**: 2026-03-31
**Plan version**: Draft
**Verdict**: **NEEDS REVISION**

---

## Overall Assessment

This is a well-structured plan with clear phase ordering, thorough shared contracts, and detailed database schema. The architecture decisions are sound for a single-org internal CRM. However, there are security gaps in the RLS policies, missing handling for several real-world failure modes, some vague acceptance criteria, and a few areas where the plan is either over- or under-specified. The issues below must be addressed before implementation begins.

---

## Critical Issues

### C1. Interview API route has no rate limiting or abuse protection

**Issue**: The `/api/interview/route.ts` is a public endpoint (no auth) that calls the Claude API. Any bot or attacker can spam it, running up your Anthropic bill with zero friction. The gate form (name + email) provides no real protection since it can be automated.

**Severity**: Critical

**Recommendation**: Add rate limiting to the interview route. At minimum: (1) IP-based rate limit via Vercel's `@vercel/edge` or a simple in-memory counter, (2) require the leadId returned from `createPartialLead` to be valid and incomplete before accepting messages, (3) cap total messages per lead (e.g., 20), (4) add a simple honeypot field to the gate form. Consider adding a CAPTCHA if abuse is observed post-launch.

---

### C2. `createPartialLead` Server Action is unauthenticated and uses service_role

**Issue**: The interview actions (`createPartialLead`, `saveInterviewTranscript`, `completeInterview`) are called from a public page with no auth. The plan says leads are inserted "via service_role from the interview endpoint (bypasses RLS)" but does not detail how the service_role client is scoped or protected in these actions. A malicious caller could invoke `createPartialLead` repeatedly to spam the leads table, or call `completeInterview` with arbitrary data.

**Severity**: Critical

**Recommendation**: (1) The interview Server Actions must validate that the leadId exists and belongs to an incomplete lead before any mutation. (2) Add a nonce or session token generated at gate time and validated on subsequent calls. (3) Rate-limit `createPartialLead` by IP or email. (4) Document explicitly which actions use service_role vs. anon client, and why.

---

### C3. RLS policy for `user_roles` has conflicting policies

**Issue**: Two policies exist on `user_roles`: "Authenticated users can view all roles" (SELECT for authenticated) and "Owner can manage roles" (ALL for owner). The ALL policy includes SELECT, INSERT, UPDATE, DELETE. For non-owner authenticated users, the SELECT policy allows reads, which is correct. But the ALL policy uses `USING (public.is_owner())` -- this means for a non-owner trying to INSERT/UPDATE/DELETE, the `USING` clause fails, which is correct for UPDATE/DELETE. However, for INSERT, Postgres uses `WITH CHECK`, not `USING`. The ALL policy applies `USING` but INSERT needs `WITH CHECK`. This means non-owners cannot insert (correct) but the policy definition is technically incorrect for the INSERT path and could behave unexpectedly across Postgres versions.

**Severity**: Critical

**Recommendation**: Split the ALL policy into separate policies: SELECT (all authenticated), INSERT/UPDATE/DELETE (owner only with explicit WITH CHECK for INSERT). This removes ambiguity and follows Supabase's own recommendations against using FOR ALL policies.

---

### C4. Audit trigger stores full row data in JSONB -- PII exposure risk

**Issue**: The `log_activity` trigger stores `to_jsonb(NEW)` and `to_jsonb(OLD)` in the metadata column. This means the activity_log table will contain copies of all lead PII (email, phone, name, business data, full interview transcripts) for every single update. This creates a data sprawl problem and makes the activity_log table a high-value target. It also means "soft delete" does not actually remove PII -- it persists in the audit log forever.

**Severity**: Critical

**Recommendation**: (1) For the generic "updated" action, store only changed field names (not values) or a diff. (2) For specific actions (status_changed, assigned), the plan already stores only relevant fields -- keep that pattern. (3) Never store the full interview_transcript in the audit log. (4) Document a PII cleanup strategy or ensure audit log entries are covered by any future data deletion requests.

---

## Major Issues

### M1. No handling for Vercel serverless function 10-second timeout on free tier

**Issue**: Risk #9 mentions this but the mitigation says "consider Vercel Pro if free tier 10s limit is hit." The plan sets `maxDuration = 30` on the interview route, but on the Vercel Hobby plan, the maximum is 10 seconds. The `maxDuration` directive only works on Pro/Enterprise plans. This means the AI interview will time out on the free tier after 10 seconds, which is not enough for a Claude API round-trip with streaming.

**Severity**: Major

**Recommendation**: State explicitly whether this project deploys on Vercel Hobby or Pro. If Hobby, the AI interview route must be redesigned: either (1) upgrade to Pro as a hard requirement before implementation, or (2) use Vercel Edge Functions (which have no timeout for streaming), or (3) use a different hosting approach for the interview endpoint. This is a blocking decision that affects architecture.

---

### M2. No validation that `position` column stays consistent during pipeline moves

**Issue**: The plan uses a `position` integer column for kanban ordering and a `moveLeadInPipeline` action. But there is no description of how positions are managed. Moving a card between columns requires recalculating positions for multiple rows. The Zod schema validates that position is a positive integer, but there is no server-side logic described for gap-based positioning, re-indexing, or handling collisions.

**Severity**: Major

**Recommendation**: Define the position strategy explicitly. Options: (1) gap-based (positions 1000, 2000, 3000 -- insert at midpoint, re-index when gaps collapse), (2) fractional (use floats), (3) full re-index on every move. For 6 users and < 100 leads per column, option 3 (re-index all cards in the destination column in a single transaction) is simplest and sufficient. Document this in the plan.

---

### M3. `removeTeamMember` deletes `user_role` row but user still exists in auth.users

**Issue**: Step 7.3 says removal "deletes user_role row (user can't access dashboard anymore)." But the user still has a valid Supabase Auth session and a profile. The `get_user_role()` function returns NULL when there is no role row. The middleware only checks if a user exists -- it does not check for a valid role. So a removed user can still access the dashboard; they just have no role, which could cause crashes or unexpected behavior in role-gated components.

**Severity**: Major

**Recommendation**: (1) The middleware must check for a valid role after confirming the user exists. If `user_role` is null in the JWT, redirect to a "your account has been deactivated" page. (2) Alternatively, disable the user in Supabase Auth (via admin API) when removing them. (3) Add a `deactivated_at` column to profiles and check it in middleware.

---

### M4. Missing `force-dynamic` on authenticated pages

**Issue**: The findings document explicitly recommends using `export const dynamic = 'force-dynamic'` on authenticated pages to prevent Next.js from caching them with stale auth data. The plan does not mention this anywhere in the implementation phases.

**Severity**: Major

**Recommendation**: Add `export const dynamic = 'force-dynamic'` to every page under `(dashboard)/` and the interview page. Document this as a standard pattern in the plan's Phase 2 step.

---

### M5. Status request approval does not validate state transitions

**Issue**: The `decideStatusRequest` action approves and updates the lead status. But there is no validation that the `current_status` recorded in the request still matches the lead's actual current status. Between request submission and approval, an admin could have changed the status directly. Approving the stale request would overwrite the admin's change.

**Severity**: Major

**Recommendation**: In `decideStatusRequest`, compare `request.current_status` against the lead's actual current status. If they differ, mark the request as "stale" and notify the admin rather than blindly applying the change.

---

### M6. No CSRF protection on Server Actions

**Issue**: Next.js Server Actions are POST requests. While Next.js 14 includes some built-in CSRF protection (origin header checking), the plan does not mention verifying this is enabled or adding custom CSRF tokens for sensitive actions like `removeTeamMember`, `changeTeamMemberRole`, or `sendLeadEmail`.

**Severity**: Major

**Recommendation**: Verify that Next.js 14.2.35's built-in Server Action CSRF protection is active (it is by default unless custom headers are used). Document this as a security assumption. For the public interview actions, add an explicit origin check since those bypass auth.

---

### M7. No pagination on leads list or activity log

**Issue**: The queries return all leads and all activity entries. With growth, the leads list page will load all leads at once. The activity timeline fetches all entries for a lead. For an internal tool with ~6 users this is fine initially, but the plan does not mention adding pagination even as a future consideration, and the acceptance criteria say "table renders all leads."

**Severity**: Major

**Recommendation**: Add server-side pagination to `getLeads()` (page + limit params) and `getLeadActivity()` from the start. It is trivial to add with Supabase `.range()` and prevents the "works in dev, breaks with real data" problem. The spec mentions leads growing over time.

---

## Minor Issues

### m1. `lead_emails.status` uses TEXT instead of enum or CHECK constraint

**Issue**: The TypeScript type comments say `'sent' | 'delivered' | 'bounced' | 'failed'` but the database column is plain TEXT with no constraint. The `status_requests.decision` column correctly uses a CHECK constraint. This inconsistency means invalid status values can be inserted.

**Severity**: Minor

**Recommendation**: Add a CHECK constraint: `CHECK (status IN ('sent', 'delivered', 'bounced', 'failed', 'complained'))` or create a `lead_email_status` enum. Include 'complained' since Resend sends that event type.

---

### m2. No index on `user_roles.user_id` for the access token hook

**Issue**: The custom_access_token_hook queries `user_roles WHERE user_id = ...` on every token refresh. The `user_id` column has a UNIQUE constraint which implicitly creates an index, so this is actually covered. However, this should be explicitly documented so future developers do not remove the UNIQUE constraint thinking it is only for data integrity.

**Severity**: Minor

**Recommendation**: Add a comment in the migration noting that the UNIQUE constraint also serves as the index for the access token hook.

---

### m3. Activity log `entity_id` is UUID but not a foreign key

**Issue**: The `activity_log.entity_id` column references entities across multiple tables (polymorphic). This means there is no referential integrity -- if a lead is hard-deleted, orphaned activity entries remain. Since leads use soft deletes this is less of a concern, but notes and emails cascade-delete with leads, leaving orphaned activity entries.

**Severity**: Minor

**Recommendation**: Accept this as a known trade-off of polymorphic tables. Add a comment in the migration. Consider adding a cleanup function that runs periodically if the activity_log grows large.

---

### m4. Invitation system does not handle re-inviting an email

**Issue**: If the owner invites someone@example.com, the invitation expires, and they try to invite the same email again, the plan does not describe whether a new invitation is created or the old one is updated. There is no UNIQUE constraint on `invitations.email` (correctly, since re-invites should be possible), but the code should handle this gracefully.

**Severity**: Minor

**Recommendation**: In `inviteTeamMember`, check for existing unexpired invitations for the same email. Either revoke the old one and create a new one, or return an error saying "invitation already pending."

---

### m5. `handle_new_user` trigger does not create a user_roles row

**Issue**: The trigger on `auth.users` INSERT creates a profile but not a user_roles row. For the invite flow (Step 7.4), the `acceptInvitation` action creates both the auth user and the user_roles row. But if someone creates a user directly in the Supabase dashboard (e.g., the initial owner setup in Step 1.8), the user_roles row must be manually created. This is mentioned in the seed step but could be forgotten.

**Severity**: Minor

**Recommendation**: Consider having the `handle_new_user` trigger also create a default `team_member` user_roles row. Then the invite flow and owner setup simply update the role to the correct value. This prevents "null role" edge cases entirely.

---

### m6. Missing error boundary for nested dashboard routes

**Issue**: The plan creates `src/app/error.tsx` (global) and mentions `src/app/(dashboard)/error.tsx` and `src/app/interview/error.tsx`, but the dashboard error boundary is not listed in the file structure (Section 5) or any implementation step.

**Severity**: Minor

**Recommendation**: Add `error.tsx` for the `(dashboard)` route group and the `interview` route to the file structure and include it in Phase 2 (dashboard shell).

---

### m7. No `loading.tsx` files for route segments

**Issue**: The plan creates a `loading.tsx` UI component for skeleton states but does not create Next.js route-level `loading.tsx` files (e.g., `src/app/(dashboard)/leads/loading.tsx`). Without these, navigation between dashboard pages will show no loading indicator while Server Components fetch data.

**Severity**: Minor

**Recommendation**: Add `loading.tsx` files for each major route segment: `(dashboard)/dashboard/`, `(dashboard)/leads/`, `(dashboard)/leads/[id]/`, `(dashboard)/pipeline/`, `(dashboard)/requests/`. These can be simple skeleton layouts.

---

### m8. Recharts is not mentioned in the dependencies to install

**Issue**: Recharts appears in the inline `npm install` in Step 1.1 but is missing from the "Dependencies to Install (Complete List)" section at the bottom of the plan. Minor inconsistency.

**Severity**: Minor

**Recommendation**: Add `recharts` to the complete list. It is present in Step 1.1 so this is just a documentation fix.

---

### m9. The plan does not specify how the owner account is initially created

**Issue**: Step 1.8 says "Creates the owner user in Supabase Auth" but does not specify the mechanism. Is this done via the Supabase dashboard? A seed SQL script? A one-time setup script? The acceptance criteria mention "Owner can log in" but the how is vague.

**Severity**: Minor

**Recommendation**: Provide explicit SQL or instructions for seed data. Example: use the Supabase dashboard to create the user, then run a SQL script that inserts the profile and user_roles rows. Or use the admin API. Be specific.

---

### m10. Spec mentions "Leads by source" analytics but source tracking is unclear

**Issue**: The spec and plan both include "leads by source" as an analytics chart. The `leads` table has a `source` column. But how is source populated? The interview flow does not set it. The fallback form has `referral_source` in the schema but it maps to `interview_data.referral_source`, not `leads.source`. There is no UTM tracking or referral detection.

**Severity**: Minor

**Recommendation**: Decide what `source` means. Options: (1) it is populated from `interview_data.referral_source` during extraction/completion, (2) it is set from UTM params in the interview page URL, (3) it defaults to "interview" vs "form" based on intake method. Define this explicitly and wire it up in the interview completion flow.

---

## Dependency and Ordering Issues

### D1. Phase 6 (Email) is marked "After Phase 4" but email sending is needed in Phase 3

**Issue**: Step 3.5 (`completeInterview`) sends confirmation and notification emails. But the email system (Resend client, templates, send helper) is not built until Phase 6. This creates a circular dependency: Phase 3 needs email, but Phase 6 comes after Phase 4.

**Severity**: Major

**Recommendation**: Move Steps 6.1 (Resend client) and 6.2 (email templates) into Phase 1 or early Phase 3. The Resend client and templates have no dependencies on leads or dashboard features. Phase 6 should only contain the compose-from-dashboard feature (Step 6.3), the webhook (Step 6.4), and the notification wiring (Step 6.5). Alternatively, have Phase 3 stub the email calls and wire them in Phase 6, but document this clearly.

---

### D2. Team management invite flow needs email templates from Phase 6

**Issue**: Step 7.3 (`inviteTeamMember`) sends an invitation email. Phase 7 is parallel with Phase 3 and Phase 4, but Phase 6 (email templates) comes after Phase 4. Same dependency issue as D1.

**Severity**: Major

**Recommendation**: Same fix as D1. Email infrastructure (client + templates) must be available before any phase that sends email.

---

## Architecture Observations (Not Issues)

These are not problems but worth noting:

1. **No multi-tenancy is the right call.** For 6 users in one org, adding `org_id` everywhere would be pure over-engineering.

2. **Server Actions over API routes is the right call.** For an internal tool, the simplicity of colocated Server Actions outweighs the flexibility of API routes. The plan correctly uses API routes only for streaming (interview) and webhooks (Resend).

3. **Recharts is a reasonable choice.** For 4 chart types on one analytics page, a full dashboard library (Tremor, etc.) would be overkill.

4. **The shared contracts section is excellent.** Defining all types and Zod schemas upfront prevents integration friction between parallel phases.

5. **The audit trigger approach is clean.** A single generic function with table-specific behavior based on changed fields is the right level of abstraction.

---

## Acceptance Criteria Review

Several acceptance criteria need tightening:

| Step | Current Criterion | Problem | Fix |
|---|---|---|---|
| 1.1 | "`npm run build` still passes" | Vague -- build can pass with warnings | "zero warnings, zero errors" |
| 1.4 | "Test: insert a user_role row manually, verify JWT contains user_role claim" | Does not specify how to verify | "Decode JWT via jwt.io or Supabase Auth debug endpoint. Confirm `user_role` key exists with correct value." |
| 2.4 | "Mobile sidebar collapses" | No breakpoint specified | "Sidebar hidden behind hamburger menu at < 768px" |
| 3.4 | "System prompt produces relevant qualifying questions" | Subjective | "System prompt tested with 5 mock conversations covering: ideal lead, vague answers, off-topic user, hostile user, non-English speaker" |
| 5.1 | "Drag between columns changes status" | Does not mention position updates | "Drag between columns changes status and position. Drag within column reorders. Positions persist after page refresh." |
| 8.1 | "Performance acceptable (< 500ms each)" | Not measured | "Each query logged with timing. Any query > 500ms triggers an EXPLAIN ANALYZE review." |

---

## Summary Verdict: NEEDS REVISION

The plan is solid structurally but has **4 critical issues** and **7 major issues** that must be resolved before implementation:

**Must fix before implementation:**
1. Rate limiting and abuse protection on the public interview endpoint (C1, C2)
2. Fix the `user_roles` RLS policy ambiguity (C3)
3. Stop storing full row data in audit log (C4)
4. Resolve the email dependency ordering (D1, D2)
5. Define position management strategy for kanban (M2)
6. Handle removed-user-with-null-role in middleware (M3)
7. Clarify Vercel plan requirement for AI timeouts (M1)
8. Validate stale status requests before approval (M5)
9. Add `force-dynamic` to authenticated pages (M4)
10. Add pagination to leads and activity queries (M7)

**Can fix during implementation:**
- All minor issues (m1-m10)
- Acceptance criteria tightening

Once the critical and major issues are addressed, the plan is ready for implementation.
