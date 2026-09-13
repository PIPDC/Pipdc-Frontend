import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Eye, UserX } from 'lucide-react';
import { Button } from '../ui/Button';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { useSendFirstMessage } from '../../hooks/mutations';
import type { Conversation, ConversationAgent, ConversationClient, ConversationProperty } from '../../types';

interface NewConversationViewProps {
  enquiryId: number;
  client: ConversationClient;
  agent: ConversationAgent;
  property: ConversationProperty;
  currentUserId: string;
  canSend: boolean;
  onSent: (conversation: Conversation) => void;
  onBack?: () => void;
}

export function NewConversationView({
  enquiryId,
  client,
  agent,
  property,
  currentUserId,
  canSend,
  onSent,
  onBack,
}: NewConversationViewProps) {
  const sendFirstMessage = useSendFirstMessage();
  const pendingKeyRef = useRef(crypto.randomUUID());

  const isClientViewer = Boolean(client.userId) && currentUserId === client.userId;
  const otherName = isClientViewer ? agent.fullName : client.fullName;
  const otherMeta = isClientViewer ? agent.agencyName : client.email;
  const conversationPossible = Boolean(client.userId) && Boolean(agent.agentId);
  const composeDisabled = !canSend || !conversationPossible;

  const handleSend = async (content: string) => {
    const result = await sendFirstMessage.mutateAsync({ enquiryId, content, idempotencyKey: pendingKeyRef.current });
    pendingKeyRef.current = crypto.randomUUID();
    onSent(result.conversation);
  };

  const backButton = onBack ? (
    <button
      type="button"
      onClick={onBack}
      aria-label="Back to conversations"
      className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100 active:bg-ink-100 lg:hidden"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  ) : null;

  return (
    <div className="flex h-[70vh] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <div className="border-b border-ink-100 p-4">
        {canSend ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {backButton}
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-gradient text-sm font-semibold text-white">
                {otherName.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">{otherName}</p>
                <p className="truncate text-xs text-ink-500">{otherMeta}</p>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden max-w-[200px] truncate text-xs text-ink-500 sm:block">{property.title}</span>
              <Link to={`/properties/${property.slug}`} className="shrink-0">
                <Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />}>
                  View Property
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {backButton}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">{property.title}</p>
                <p className="mt-0.5 truncate text-xs text-ink-500">
                  {client.fullName} ↔ {agent.fullName}
                </p>
              </div>
            </div>
            <Link to={`/properties/${property.slug}`} className="shrink-0">
              <Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />}>
                View Property
              </Button>
            </Link>
          </div>
        )}
      </div>

      <MessageList messages={[]} currentUserId={currentUserId} isLoading={false} isError={false} onRetry={() => undefined} />

      <div className="border-t border-ink-100 bg-white">
        {!canSend && (
          <p className="flex items-center gap-2 bg-ink-50 px-4 py-2 text-xs text-ink-500">
            <Eye className="h-3.5 w-3.5" />
            You are viewing this conversation as an administrator. Only the client and the property agent can send messages.
          </p>
        )}
        {canSend && !conversationPossible && (
          <p className="flex items-center gap-2 bg-gold-50 px-4 py-2 text-xs text-ink-600">
            <UserX className="h-3.5 w-3.5" />
            This enquiry was submitted by an anonymous visitor and cannot be converted into a conversation.
          </p>
        )}
        <MessageComposer canSend={!composeDisabled} sending={sendFirstMessage.isPending} onSend={handleSend} />
      </div>
    </div>
  );
}
