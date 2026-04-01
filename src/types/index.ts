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

export type NotificationType =
  | 'new_lead'
  | 'request_submitted'
  | 'request_decided'
  | 'lead_assigned'
  | 'lead_status_changed';

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
  demo_date: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  position: number;
  stage_entered_at: string;
  is_complete: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_profile?: Profile;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string;
  content: string;
  created_at: string;
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
  requester?: Profile;
  decider?: Profile;
  lead?: Pick<Lead, 'id' | 'name' | 'email' | 'business_name'>;
}

export interface ActivityLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user?: Profile;
}

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
  nonce: string;
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
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
