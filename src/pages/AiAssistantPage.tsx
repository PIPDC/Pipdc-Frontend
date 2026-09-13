import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Trash2, MapPin, ArrowUpRight, Bot, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useAiSession } from '../hooks/queries';
import { useClearAiSession, useSendAiMessage } from '../hooks/mutations';
import { extractApiError } from '../services/api';
import { formatPrice, timeAgo } from '../utils/format';
import type { AiChatMessage, Property } from '../types';

const suggestions = [
  'Find me a 2-bedroom apartment for rent in Jos',
  'I want to buy a 4-bedroom house in Rayfield',
  'What properties are under ₦50 million in Plateau State?',
];

export function AiAssistantPage() {
  const { notify } = useToast();
  const sessionQuery = useAiSession();
  const sendMutation = useSendAiMessage();
  const clearMutation = useClearAiSession();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionQuery.data?.messages.length) {
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

    const optimistic: AiChatMessage = { role: 'user', content, sentAt: new Date().toISOString(), properties: null };
    setMessages((prev) => [...prev, optimistic]);

    sendMutation.mutate(content, {
      onError: (error) => {
        setMessages((prev) => [...prev.filter((m) => m !== optimistic)]);
        notify({ type: 'error', title: 'Assistant unavailable', description: extractApiError(error) });
      },
      onSuccess: (data) => {
        setMessages((prev) => [...prev.filter((m) => m !== optimistic), data.assistantMessage]);
      },
    });
  };

  const handleClear = () => {
    clearMutation.mutate(undefined, {
      onSuccess: () => setMessages([]),
      onError: (error) => notify({ type: 'error', title: 'Could not clear history', description: extractApiError(error) }),
    });
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="container-x py-6 md:py-10">
      <Card className="mx-auto flex h-[72vh] max-w-3xl flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-500 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-ink-900">PIPDC Assistant</h1>
              <p className="text-xs text-ink-500">Find real properties from the PIPDC marketplace</p>
            </div>
          </div>
          {hasMessages && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={handleClear}
              loading={clearMutation.isPending}
            >
              Clear
            </Button>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
          <AnimatePresence initial={false}>
            {!hasMessages && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="py-6 text-center">
                <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-500">
                  Ask for property recommendations by location and budget — for example: “Find me a 2-bedroom apartment to rent in Jos
                  under ₦150,000 a year.” I only recommend live listings on PIPDC.
                </p>
                <div className="mx-auto mt-5 flex max-w-md flex-col gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-left text-sm text-ink-700 transition-colors hover:border-forest-500 hover:text-forest-600"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((message, index) => (
            <ChatBubble key={`${message.sentAt}-${index}`} message={message} />
          ))}

          {sendMutation.isPending && (
            <div className="flex items-start gap-3">
              <Avatar type="model" />
              <div className="rounded-2xl rounded-tl-md border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-600">
                <TypingDots />
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="border-t border-ink-100 p-4"
        >
          <div className="flex items-center gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about properties in your chosen location and budget…"
              className="h-12"
              maxLength={2000}
              aria-label="Message the assistant"
            />
            <Button type="submit" size="icon" variant="primary" loading={sendMutation.isPending} aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ChatBubble({ message }: { message: AiChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <Avatar type={message.role} />
      <div className={`max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-left ${
            isUser ? 'rounded-tr-md bg-forest-500 text-white' : 'rounded-tl-md border border-ink-100 bg-ink-50 text-ink-800'
          }`}
        >
          {message.content || (message.properties?.length ? 'Here are some properties that match your request:' : '')}
        </div>
        {message.properties && message.properties.length > 0 && (
          <div className="mt-3 space-y-3 text-left">
            {message.properties.map((property) => (
              <MiniPropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
        <p className={`mt-1.5 text-[11px] text-ink-400 ${isUser ? 'text-right' : ''}`}>{timeAgo(message.sentAt)}</p>
      </div>
    </motion.div>
  );
}

function Avatar({ type }: { type: AiChatMessage['role'] }) {
  const isUser = type === 'user';
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        isUser ? 'bg-ink-100 text-ink-700' : 'bg-forest-500 text-white'
      }`}
    >
      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
    </div>
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
      className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-3 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <img
        src={property.coverImage ?? property.images[0]}
        alt={property.title}
        className="h-16 w-20 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-semibold text-forest-600">
          {formatPrice(property.price, property.currency)}
          {property.period && <span className="text-xs font-medium text-ink-400">{property.period}</span>}
        </p>
        <h3 className="truncate text-sm font-medium text-ink-900">{property.title}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
          <MapPin className="h-3 w-3" /> {location}
        </p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-400" />
    </Link>
  );
}