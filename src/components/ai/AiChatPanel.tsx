import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, MapPin, Send, Sparkles, Trash2, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useAiSession } from '../../hooks/queries';
import { useSendAiMessage, useClearAiSession } from '../../hooks/mutations';
import { extractApiError } from '../../services/api';
import { cn } from '../../utils/cn';
import type { AiChatMessage, Property } from '../../types';

export interface AiChatPanelProps {
  embedded?: boolean;
  onClose?: () => void;
}

const suggestions = [
  'Find me a 2-bedroom apartment to rent in Jos under ₦150,000 a year',
  'I want to buy a 4-bedroom house in Rayfield',
  'Show me 3-bedroom properties in Plateau State',
];

export function AiChatPanel({ embedded = false, onClose }: AiChatPanelProps) {
  const { notify } = useToast();
  const sessionQuery = useAiSession();
  const sendMutation = useSendAiMessage();
  const clearMutation = useClearAiSession();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const hydratedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionQuery.data?.messages.length && !hydratedRef.current) {
      hydratedRef.current = true;
      setMessages(sessionQuery.data.messages);
    }
  }, [sessionQuery.data]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sendMutation.isPending]);

  const handleSend = (raw: string) => {
    const content = raw.trim();
    if (!content || sendMutation.isPending) return;
    setInput('');

    const optimistic: AiChatMessage = {
      role: 'user',
      content,
      sentAt: new Date().toISOString(),
      properties: [],
    };
    setMessages((prev) => [...prev, optimistic]);

    sendMutation.mutate(content, {
      onError: (error) => {
        setMessages((prev) => prev.filter((m) => m !== optimistic));
        notify({ type: 'error', title: 'Assistant unavailable', description: extractApiError(error) });
      },
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev.filter((m) => m !== optimistic),
          ...(data.assistantMessage ? [data.assistantMessage] : []),
        ]);
      },
    });
  };

  const handleClear = () => {
    clearMutation.mutate(undefined, {
      onSuccess: () => setMessages([]),
      onError: (error) =>
        notify({ type: 'error', title: 'Could not clear history', description: extractApiError(error) }),
    });
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex max-h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-ink-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-500 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-ink-900">PIPDC Concierge</p>
            <p className="text-[11px] text-ink-500">Live property recommendations</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasMessages && (
            <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={handleClear} loading={clearMutation.isPending}>
              Clear
            </Button>
          )}
          {embedded && onClose && (
            <Button variant="ghost" size="icon" aria-label="Close concierge" onClick={onClose}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {!hasMessages && (
          <div className="space-y-2 py-4 text-center">
            <p className="text-sm text-ink-500">
              Ask for property recommendations by location and budget — for example: “Find me a 2-bedroom
              apartment to rent in Jos under ₦150,000 a year.”
            </p>
            <div className="mx-auto mt-3 flex max-w-sm flex-col gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-left text-xs text-ink-700 transition-colors hover:border-forest-500 hover:text-forest-600"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatBubble key={message.sentAt} message={message} />
        ))}

        {sendMutation.isPending && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-500 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-md border border-ink-100 bg-ink-50 px-4 py-3">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="shrink-0 border-t border-ink-100 px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about location, budget, bedrooms…"
            maxLength={2000}
            className="h-11 flex-1 rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-800 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
          />
          <Button type="submit" size="icon" variant="primary" loading={sendMutation.isPending} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function ChatBubble({ message }: { message: AiChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-end gap-2', isUser ? 'flex-row-reverse' : '')}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-ink-100 text-ink-600' : 'bg-forest-500 text-white'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn('max-w-[85%]', isUser ? 'text-right' : '')}>
        <div
          className={cn(
            'inline-block whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed',
            isUser ? 'bg-forest-500 text-white' : 'rounded-tl-md border border-ink-100 bg-ink-50 text-ink-800'
          )}
        >
          {message.content}
        </div>
        {message.properties && message.properties.length > 0 && (
          <div className="mt-2 space-y-2 text-left">
            {message.properties.map((p) => (
              <MiniPropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-ink-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

function MiniPropertyCard({ property }: { property: Property }) {
  const location = [property.area, property.city].filter(Boolean).join(', ') || property.state;
  return (
    <Link
      to={`/properties/${property.slug}`}
      className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 text-left transition-colors hover:border-forest-500"
    >
      <img
        src={property.coverImage ?? property.images[0]}
        alt={property.title}
        className="h-14 w-18 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-forest-600">
          {formatPrice(property.price, property.currency)}
          {property.period && <span className="text-xs font-medium text-ink-400">{property.period}</span>}
        </p>
        <h3 className="truncate text-sm font-medium text-ink-800">{property.title}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
          <MapPin className="h-3 w-3" /> {location}
        </p>
      </div>
    </Link>
  );
}
