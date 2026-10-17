import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button';

interface MessageComposerProps {
  canSend: boolean;
  sending: boolean;
  onSend: (content: string) => Promise<void>;
  /** Focus the textarea on mount so an opened conversation is ready to type in. */
  autoFocus?: boolean;
}

export function MessageComposer({ canSend, sending, onSend, autoFocus }: MessageComposerProps) {
  const [draft, setDraft] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    try {
      await onSend(content);
      setDraft('');
    } catch {
      // The parent shows the error toast; keep the draft so the text is not lost.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-ink-100 bg-white p-3">
      <div className="flex items-end gap-2">
        <textarea
          autoFocus={autoFocus}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={1}
          placeholder={canSend ? 'Type a message…' : 'Sending is disabled for this account'}
          disabled={!canSend}
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-base md:text-sm text-ink-800 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400"
        />
        <Button type="submit" size="md" loading={sending} disabled={!canSend || !draft.trim()} leftIcon={<Send className="h-4 w-4" />}>
          Send
        </Button>
      </div>
    </form>
  );
}
