import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conversationService } from '../services/conversationService';
import type { Conversation } from '../types';

/**
 * Batch 6 hooks.
 *
 * These live in their own file rather than in `queries.ts`/`mutations.ts` because
 * escalation is a separate concern from ordinary messaging, and it keeps the
 * existing messaging query keys untouched.
 *
 * Note: `hooks/queries.ts` is off-limits, so the conversation query keys are
 * re-declared here as literals that match the ones it exports. They are compared
 * by value, not by identity, so invalidating here invalidates the list rendered by
 * `useConversations()`.
 */
const CONVERSATIONS_KEY = ['conversations'] as const;
const ESCALATIONS_KEY = ['conversations', 'escalations'] as const;

const conversationKey = (id: number) => ['conversations', id] as const;

/** Admin queue. `status` narrows the queue; omit it for everything not yet closed. */
export function useEscalationQueue(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...ESCALATIONS_KEY, params ?? {}],
    queryFn: () => conversationService.listEscalations(params),
    // Polled because the only push signal is the per-conversation SignalR group,
    // which a queue page is not a member of.
    refetchInterval: 30_000,
  });
}

export function useEscalateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => conversationService.escalate(id, reason),
    onSuccess: (conversation: Conversation) => {
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: ESCALATIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: conversationKey(conversation.id) });
    },
  });
}

export function useClaimConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => conversationService.claim(id),
    onSuccess: (conversation: Conversation) => {
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: ESCALATIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: conversationKey(conversation.id) });
    },
  });
}

export function useResolveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => conversationService.resolve(id),
    onSuccess: (conversation: Conversation) => {
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: ESCALATIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: conversationKey(conversation.id) });
    },
  });
}
