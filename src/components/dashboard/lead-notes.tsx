'use client';

import { useState, useTransition } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createNote, deleteNote } from '@/lib/actions/notes';
import { useUser } from '@/hooks/use-user';
import { toast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import type { LeadNote } from '@/types';

interface LeadNotesProps {
  leadId: string;
  initialNotes: LeadNote[];
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function LeadNotes({ leadId, initialNotes }: LeadNotesProps) {
  const user = useUser();
  const [notes, setNotes] = useState<LeadNote[]>(initialNotes);
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!content.trim()) return;
    startTransition(async () => {
      const result = await createNote({ lead_id: leadId, content: content.trim() });
      if (result.success && result.data) {
        setNotes((prev) => [result.data!, ...prev]);
        setContent('');
        toast('success', 'Note added');
      } else {
        toast('error', result.error ?? 'Failed to add note');
      }
    });
  }

  function handleDelete(noteId: string) {
    startTransition(async () => {
      const result = await deleteNote(noteId);
      if (result.success) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        toast('success', 'Note deleted');
      } else {
        toast('error', result.error ?? 'Failed to delete note');
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 bg-white p-4">
        <Textarea
          placeholder="Add a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isPending || !content.trim()}
          >
            {isPending ? 'Adding...' : 'Add Note'}
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          No notes yet
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    size="sm"
                    src={note.author?.avatar_url}
                    fallback={note.author?.full_name ?? 'U'}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {note.author?.full_name ?? 'Unknown'}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      {formatTimestamp(note.created_at)}
                    </span>
                  </div>
                </div>
                {note.author_id === user.id && (
                  <button
                    onClick={() => handleDelete(note.id)}
                    disabled={isPending}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    title="Delete note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
