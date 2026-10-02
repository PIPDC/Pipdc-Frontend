import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '../contexts/RealtimeContext';
import { queryKeys } from './queries';
import type { Conversation } from '../types';

const ESCALATION_CHANGED_EVENT = 'ConversationEscalationChanged';

/**
 * Batch 6. The backend broadcasts an escalation change to the conversation's own
 * SignalR group, which is exactly the set of people allowed to see it, so no
 * separate notification channel is needed for this.
 *
 * The handler only invalidates caches. The event carries the updated conversation
 * because the group broadcast has to identify which thread changed, but a refetch
 * is what actually applies it, so a message and a state change can never disagree.
 */
export function useEscalationChangeListener() {
  const { connection } = useRealtime();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!connection) return;

    const handler = (conversation: Conversation) => {
      if (!conversation || typeof conversation.id !== 'number') {
        console.warn('[realtime] Ignoring malformed ConversationEscalationChanged payload.', conversation);
        return;
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversation.id) });
      void queryClient.invalidateQueries({ queryKey: ['conversations', 'escalations'] });
    };

    connection.on(ESCALATION_CHANGED_EVENT, handler);

    return () => {
      connection.off(ESCALATION_CHANGED_EVENT, handler);
    };
  }, [connection, queryClient]);
}
