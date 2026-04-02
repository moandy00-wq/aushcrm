'use client';

import { useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { sendLeadEmail, generateEmailDraft } from '@/lib/actions/emails';
import { toast } from '@/hooks/use-toast';
import { Mail, Sparkles, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import type { LeadEmail, LeadEmailStatus } from '@/types';

type LeadEmailWithDirection = LeadEmail;

interface LeadEmailsProps {
  leadId: string;
  initialEmails: LeadEmail[];
}

const STATUS_BADGE: Record<LeadEmailStatus, { label: string; variant: 'default' | 'success' | 'destructive' | 'warning' }> = {
  sent: { label: 'Sent', variant: 'default' },
  delivered: { label: 'Delivered', variant: 'success' },
  bounced: { label: 'Bounced', variant: 'destructive' },
  failed: { label: 'Failed', variant: 'destructive' },
  complained: { label: 'Complained', variant: 'warning' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function LeadEmails({ leadId, initialEmails }: LeadEmailsProps) {
  const [emails, setEmails] = useState<LeadEmailWithDirection[]>(initialEmails as LeadEmailWithDirection[]);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showAiContext, setShowAiContext] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  function handleSend() {
    if (!subject.trim() || !body.trim()) return;
    startTransition(async () => {
      const result = await sendLeadEmail({
        lead_id: leadId,
        subject: subject.trim(),
        body: body.trim(),
      });
      if (result.success && result.data) {
        setEmails((prev) => [result.data!, ...prev]);
        setSubject('');
        setBody('');
        setOpen(false);
        toast('success', 'Email sent');
      } else {
        toast('error', result.error ?? 'Failed to send email');
      }
    });
  }

  async function handleDraftWithAi() {
    setIsDrafting(true);
    try {
      const result = await generateEmailDraft(
        leadId,
        aiContext.trim() || undefined
      );
      if (result.success && result.data) {
        setSubject(result.data.subject);
        setBody(result.data.body);
        setShowAiContext(false);
        setAiContext('');
        toast('success', 'Draft generated');
      } else {
        toast('error', result.error ?? 'Failed to generate draft');
      }
    } catch {
      toast('error', 'Failed to generate draft');
    } finally {
      setIsDrafting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">
          {emails.length} email{emails.length !== 1 ? 's' : ''}
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Mail className="mr-1.5 h-4 w-4" />
              Compose Email
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compose Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAiContext((v) => !v)}
                  disabled={isDrafting}
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Draft with AI
                </Button>
                {showAiContext && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Optional context (e.g. 'follow up about their demo', 're-engage after going cold')..."
                      value={aiContext}
                      onChange={(e) => setAiContext(e.target.value)}
                      rows={2}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleDraftWithAi}
                      disabled={isDrafting}
                    >
                      {isDrafting ? 'Generating...' : 'Generate Draft'}
                    </Button>
                  </div>
                )}
              </div>
              <Input
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Textarea
                placeholder="Write your email..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
              />
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isPending || !subject.trim() || !body.trim()}
              >
                {isPending ? 'Sending...' : 'Send'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {emails.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          No emails yet
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => {
            const badge = STATUS_BADGE[email.status];
            const isInbound = email.direction === 'inbound';
            return (
              <div
                key={email.id}
                className={`border bg-white p-4 ${isInbound ? 'border-l-2 border-l-blue-400 border-gray-200' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {isInbound ? (
                        <ArrowDownLeft className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      )}
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {email.subject}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-gray-400 ml-5">
                      {isInbound
                        ? `From: ${email.from_email ?? 'unknown'}`
                        : `To: ${email.to_email}`}
                      {' '}&middot; {formatDate(email.created_at)}
                    </p>
                  </div>
                  <Badge variant={badge.variant}>
                    {isInbound ? 'Received' : badge.label}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap line-clamp-3 ml-5">
                  {email.body}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
