import { useEffect, useRef } from 'react';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  /** Copy shown inside an empty thread, so a fresh conversation still guides the user. */
  emptyMessage?: string;
}

export function MessageList({ messages, currentUserId, isLoading, isError, onRetry, emptyMessage }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [messages.length, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto bg-ink-50/40 p-4">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-3 w-24 rounded bg-ink-100 animate-pulse" />
              <div className="h-10 w-2/3 rounded-2xl bg-ink-100 animate-pulse" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MessageSquare className="h-6 w-6 text-gold-500" />
          <p className="text-sm text-ink-500">Could not load messages.</p>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <MessageSquare className="h-6 w-6 text-ink-300" />
          <p className="text-sm text-ink-500">
            {emptyMessage ?? "No messages yet. Start the conversation."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            return (
              <MessageBubble
                key={m.id}
                message={m}
                isOwn={m.senderUserId === currentUserId}
                showSender={!prev || prev.senderUserId !== m.senderUserId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
