'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { InterviewGate } from '@/components/interview/interview-gate';
import { ChatInterface } from '@/components/interview/chat-interface';
import { FallbackForm } from '@/components/interview/fallback-form';
import { InterviewComplete } from '@/components/interview/interview-complete';
import type { InterviewSession } from '@/types';

type InterviewState = 'gate' | 'chat' | 'form' | 'complete';

export default function InterviewPage() {
  const [state, setState] = useState<InterviewState>('gate');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [userName, setUserName] = useState('');

  function handleGateComplete(s: InterviewSession, name?: string) {
    setSession(s);
    if (name) setUserName(name);
    setState('chat');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16 dark:bg-gray-950">
      <Link
        href="/"
        className="fixed top-6 left-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors z-10"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      {state === 'gate' && (
        <InterviewGate
          onComplete={(s, name) => handleGateComplete(s, name)}
          onSwitchToForm={() => setState('form')}
        />
      )}

      {state === 'chat' && session && (
        <ChatInterface
          session={session}
          userName={userName}
          onComplete={() => setState('complete')}
          onSwitchToForm={() => setState('form')}
        />
      )}

      {state === 'form' && (
        <FallbackForm
          onComplete={() => setState('complete')}
          onSwitchToChat={() => setState('gate')}
        />
      )}

      {state === 'complete' && <InterviewComplete />}
    </main>
  );
}
