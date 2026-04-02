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
  website: z.string().max(0, 'Bot detected'),
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
  pain_points: z.string().min(1),
  current_tools: z.string().optional(),
  goals: z.string().min(1),
  referral_source: z.string().optional(),
  website: z.string().max(0, 'Bot detected'),
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
  decision_note: z.string().max(2000).optional(),
});

// Invitations
export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'team_member']),
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
