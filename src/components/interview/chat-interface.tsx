'use client';

import { useRef, useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './chat-message';
import { completeInterview } from '@/lib/actions/interview';
import type { InterviewSession, ChatMessage as ChatMessageType } from '@/types';

interface ChatInterfaceProps {
  session: InterviewSession;
  userName: string;
  onComplete: () => void;
  onSwitchToForm: () => void;
}

export function ChatInterface({
  session,
  userName,
  onComplete,
  onSwitchToForm,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState('');
  const hasSentInitial = useRef(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/interview',
      body: { leadId: session.leadId, nonce: session.nonce },
    }),
  });

  const isStreaming = status === 'streaming';
  const isSubmitted = status === 'submitted';
  const isBusy = isStreaming || isSubmitted;

  // Send the initial message with the user's name to kick off the conversation
  useEffect(() => {
    if (!hasSentInitial.current) {
      hasSentInitial.current = true;
      sendMessage({
        text: `Hi, my name is ${userName}.`,
      });
    }
  }, [userName, sendMessage]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isBusy) return;

    sendMessage({ text });
    setInputValue('');
    inputRef.current?.focus();
  }

  // Count assistant messages to decide when to show the "End Interview" button
  const assistantMessageCount = messages.filter((m) => m.role === 'assistant').length;
  const showEndButton = assistantMessageCount >= 6;

  async function handleEnd() {
    setCompleting(true);
    setCompletionError('');

    // Convert messages to ChatMessage[] format
    const transcript: ChatMessageType[] = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.parts
        ?.filter((p) => p.type === 'text')
        .map((p) => (p as { type: 'text'; text: string }).text)
        .join('') || '',
    }));

    const result = await completeInterview(session.leadId, session.nonce, transcript);

    if (result.success) {
      onComplete();
    } else {
      setCompletionError(result.error || 'Failed to complete interview.');
      setCompleting(false);
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Aush Intake Interview
          </h2>
          <p className="text-xs text-gray-500">
            Chat with our AI to tell us about your business
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToForm}
          className="text-xs text-gray-400 underline underline-offset-2 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
        >
          Switch to form
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6"
        style={{ minHeight: 400, maxHeight: 'calc(100vh - 280px)' }}
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role as 'user' | 'assistant'}
            parts={message.parts as Array<{ type: string; text?: string }>}
          />
        ))}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 px-4 py-3 text-sm text-gray-400">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* End interview section */}
      {showEndButton && (
        <div className="flex items-center justify-center border-t border-gray-100 px-6 py-3 dark:border-gray-800">
          <Button
            onClick={handleEnd}
            disabled={completing || isBusy}
            variant="secondary"
            size="sm"
          >
            {completing ? 'Saving...' : 'End Interview'}
          </Button>
          {completionError && (
            <p className="ml-3 text-xs text-red-600">{completionError}</p>
          )}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          disabled={isBusy || completing}
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!inputValue.trim() || isBusy || completing}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
