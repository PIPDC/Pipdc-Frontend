import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, MessagesSquare, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { primaryRole } from '../../utils/roles';
import { useConversations, useConversation, useEnquiryConversationState } from '../../hooks/queries';
import { useMarkConversationRead } from '../../hooks/mutations';
import { useConversationSubscription } from '../../hooks/useConversationSubscription';
import { useNewMessageListener } from '../../hooks/useNewMessageListener';
import { conversationService } from '../../services/conversationService';
import { extractApiError } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { cn } from '../../utils/cn';
import type { Conversation } from '../../types';
import { ConversationList } from './ConversationList';
import { ConversationView } from './ConversationView';
import { NewConversationView } from './NewConversationView';

export function MessagingSection() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = primaryRole(user?.roles);

  const conversationParam = searchParams.get('conversation');
  const selectedId = conversationParam && /^\d+$/.test(conversationParam) ? Number(conversationParam) : null;

  useConversationSubscription(selectedId);
  useNewMessageListener();

  const enquiryParam = searchParams.get('enquiry');
  const enquiryId = enquiryParam && /^\d+$/.test(enquiryParam) ? Number(enquiryParam) : null;

  const propertyParam = searchParams.get('property');
  const propertyId = propertyParam && /^\d+$/.test(propertyParam) ? Number(propertyParam) : null;

  const conversationsQuery = useConversations();
  const listItems = conversationsQuery.data?.items ?? [];

  const needsDetailFetch = selectedId !== null && !listItems.some((c) => c.id === selectedId);
  const conversationDetail = useConversation(needsDetailFetch ? selectedId : undefined);
  const [justCreated, setJustCreated] = useState<Conversation | null>(null);
  const selected =
    justCreated ??
    (selectedId !== null ? listItems.find((c) => c.id === selectedId) ?? conversationDetail.data : undefined);

  const stateQuery = useEnquiryConversationState(enquiryId ?? undefined);
  const markRead = useMarkConversationRead();

  const attemptedProperty = useRef<number | null>(null);
  const attemptedRead = useRef<number | null>(null);
  const [resolvingProperty, setResolvingProperty] = useState(false);

  useEffect(() => {
    if (justCreated && selectedId !== justCreated.id) setJustCreated(null);
  }, [justCreated, selectedId]);

  // Opening an enquiry never creates a Conversation: the backend returns the messaging
  // state read-only. If that enquiry already has a Conversation, canonicalize the URL to
  // it so the conversation list drives the selection.
  useEffect(() => {
    if (enquiryId === null || !stateQuery.data?.conversation) return;
    const conversationId = stateQuery.data.conversation.id;
    if (selectedId === conversationId) return;
    setSearchParams({ conversation: String(conversationId) }, { replace: true });
  }, [enquiryId, stateQuery.data, selectedId, setSearchParams]);

  // Direct ?property= entry (e.g. after a login redirect) resolves the enquiry without
  // ever creating a Conversation, then switches to the enquiry param.
  useEffect(() => {
    if (propertyId === null || attemptedProperty.current === propertyId || !user) return;
    attemptedProperty.current = propertyId;
    setResolvingProperty(true);
    conversationService
      .resolveEnquiryForProperty(propertyId, crypto.randomUUID())
      .then((enquiry) => setSearchParams({ enquiry: String(enquiry.id) }, { replace: true }))
      .catch((err) => {
        notify({ type: 'error', title: 'Could not open conversation', description: extractApiError(err) });
        setSearchParams({}, { replace: true });
      })
      .finally(() => setResolvingProperty(false));
  }, [propertyId, user, notify, setSearchParams]);

  useEffect(() => {
    if (selectedId === null || role === 'Admin' || attemptedRead.current === selectedId) return;
    attemptedRead.current = selectedId;
    markRead.mutate(selectedId);
  }, [selectedId, role, markRead]);

  const canSend = role !== 'Admin';
  const currentUserId = user?.id ?? '';

  const hasActivePane = selectedId !== null || enquiryId !== null || resolvingProperty;

  const renderPane = () => {
    if (resolvingProperty) {
      return (
        <div className="flex h-[70dvh] min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-ink-100 bg-white text-ink-500">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-forest-500 border-t-transparent" />
          <p className="text-sm">Opening conversation…</p>
        </div>
      );
    }

    if (enquiryId !== null) {
      if (stateQuery.isLoading || (stateQuery.data?.conversation && !selected)) {
        return (
          <div className="flex h-[70dvh] min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-ink-100 bg-white text-ink-500">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-forest-500 border-t-transparent" />
            <p className="text-sm">Loading…</p>
          </div>
        );
      }

      if (stateQuery.isError) {
        return (
          <div className="flex h-[70dvh] min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-ink-100 bg-white text-ink-500">
            <AlertTriangle className="h-6 w-6 text-gold-500" />
            <p className="text-sm">Could not load this conversation.</p>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => stateQuery.refetch()}>
              Try again
            </Button>
          </div>
        );
      }

      const state = stateQuery.data;
      if (state && !state.conversation) {
        return (
          <NewConversationView
            enquiryId={enquiryId}
            client={state.client}
            agent={state.agent}
            property={state.property}
            currentUserId={currentUserId}
            canSend={canSend}
            onSent={(conversation) => {
              setJustCreated(conversation);
              setSearchParams({ conversation: String(conversation.id) }, { replace: true });
            }}
            onBack={() => setSearchParams({}, { replace: true })}
          />
        );
      }
    }

    if (selected) {
      return (
        <ConversationView
          conversation={selected}
          currentUserId={currentUserId}
          canSend={canSend}
          onBack={() => setSearchParams({}, { replace: true })}
        />
      );
    }

    return (
      <EmptyState
        icon={<MessagesSquare className="h-6 w-6" />}
        title="Select a conversation"
        description="Choose a conversation from the list to view its messages, or open one from your enquiries. A conversation begins with your first message."
      />
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px,minmax(0,1fr)]">
      <div className={cn(hasActivePane ? 'hidden lg:block' : undefined)}>
        <ConversationList
          conversations={listItems}
          isLoading={conversationsQuery.isLoading}
          isError={conversationsQuery.isError}
          onRetry={() => conversationsQuery.refetch()}
          selectedId={selectedId}
          currentUserId={currentUserId}
          onSelect={(id) => setSearchParams({ conversation: String(id) })}
        />
      </div>
      <div className={cn(!hasActivePane ? 'hidden lg:block' : undefined)}>{renderPane()}</div>
    </div>
  );
}
