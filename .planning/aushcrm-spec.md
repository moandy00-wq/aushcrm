# AushCRM — Interview Spec (Phase 1 Complete)

## Product
Internal CRM for Aush (custom-tailored CRM solutions for business owners). Leads apply via AI chat interview on the landing page. Aush team manages leads through a role-based dashboard.

## AI Chat Interview
- Embedded on landing page, linked from "Get Started" button
- Gate: name + email before chat starts
- Claude API powers adaptive qualifying questions
- Guardrails keep conversation on-topic and professional
- Fallback: static form for non-chat users
- Email confirmation via Resend after completion
- Partial saves if visitor abandons mid-interview

## Roles
- **Owner**: sees everything, manages team/permissions, dedicated owner panel
- **Admin (3)**: sees all leads, assigns contacts, views analytics, approves status requests, adds notes, sends emails
- **Team Member (few)**: sees only assigned leads, submits status change requests with notes, adds notes

## Pipeline
New > Under Review > Contacted > Demo Scheduled > Onboarding > Active Client > Closed Lost

## Status Change Requests
Team members cannot change status directly. They submit a request + note. Admin/Owner approves or denies.

## Dashboard Features
- Lead management with search/filter
- Kanban pipeline board (admin/owner)
- Built-in email via Resend
- Notes on leads (admin/owner visible)
- Email notifications on new leads
- Activity feed (all actions logged)

## Analytics (Admin/Owner)
- KPI cards: total leads, new this week, conversion rate
- Funnel: leads by stage + drop-off
- Line chart: leads over time
- Bar chart: avg time per stage
- Team leaderboard
- Pending status requests
- Activity feed
- Leads by source

## Tech Stack
Next.js 14, React 18, TypeScript, Tailwind 3.4, Supabase (auth + DB), Resend, Claude API, Vercel

## Design
- Light mode dashboard
- Existing landing page preserved
- No rounded corners on containers
- Sharp, professional, border-based design

## Team
Owner + 3 admins + a few team members
