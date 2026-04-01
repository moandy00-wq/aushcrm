'use client';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  parts: Array<{ type: string; text?: string }>;
}

export function ChatMessage({ role, parts }: ChatMessageProps) {
  const isUser = role === 'user';

  const text = parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join('');

  if (!text) return null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed rounded-sm ${
          isUser
            ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        {text}
      </div>
    </div>
  );
}
