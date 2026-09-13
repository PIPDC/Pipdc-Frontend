import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { useMessages } from '../../hooks/queries';
import { useSendMessage } from '../../hooks/mutations';
import type { Conversation } from '../../types';

interface ConversationViewProps {
  conversation: Conversation;
  currentUserId: string;
  canSend: boolean;
  onBack?: () => void;
}

export function ConversationView({ conversation, currentUserId, canSend, onBack }: ConversationViewProps) {
  const messagesQuery = useMessages(conversation.id);
  const sendMessage = useSendMessage();
  // One idempotency key per send intent: reused on failure/retry so a lost response
  // is replayed instead of delivering a duplicate message, and only rotated on success.
  const pendingKeyRef = useRef(crypto.randomUUID());

  const isClientViewer = conversation.client.userId === currentUserId;
  const otherName = isClientViewer ? conversation.agent.fullName : conversation.client.fullName;
  const otherMeta = isClientViewer ? conversation.agent.agencyName : conversation.client.email;

  const handleSend = async (content: string) => {
    await sendMessage.mutateAsync({ conversationId: conversation.id, content, idempotencyKey: pendingKeyRef.current });
    pendingKeyRef.current = crypto.randomUUID();
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
    <div className="flex h-[70dvh] min-h-[300px] flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white">
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
              <span className="hidden max-w-[200px] truncate text-xs text-ink-500 sm:block">{conversation.property.title}</span>
              <Link to={`/properties/${conversation.property.slug}`} className="shrink-0">
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
                <p className="truncate text-sm font-semibold text-ink-900">{conversation.property.title}</p>
                <p className="mt-0.5 truncate text-xs text-ink-500">
                  {conversation.client.fullName} ↔ {conversation.agent.fullName}
                </p>
              </div>
            </div>
            <Link to={`/properties/${conversation.property.slug}`} className="shrink-0">
              <Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />}>
                View Property
              </Button>
            </Link>
          </div>
        )}
      </div>

      <MessageList
        messages={messagesQuery.data ?? []}
        currentUserId={currentUserId}
        isLoading={messagesQuery.isLoading}
        isError={messagesQuery.isError}
        onRetry={() => messagesQuery.refetch()}
      />

      <div className="border-t border-ink-100 bg-white">
        {!canSend && (
          <p className="flex items-center gap-2 bg-ink-50 px-4 py-2 text-xs text-ink-500">
            <Eye className="h-3.5 w-3.5" />
            You are viewing this conversation as an administrator. Only the client and the property agent can send messages.
          </p>
        )}
        <MessageComposer canSend={canSend} sending={sendMessage.isPending} onSend={handleSend} />
      </div>
    </div>
  );
}
