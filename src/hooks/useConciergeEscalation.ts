import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conciergeEscalationService } from '../services/conciergeEscalationService';
import type { ConciergeEscalation } from '../types';

/**
 * Concierge-escalation hooks. Kept out of `queries.ts`/`mutations.ts` for the
 * same reason as the conversation-escalation hooks: a distinct concern with its
 * own query keys, so ordinary AI-chat and messaging queries stay untouched.
 */
const QUEUE_KEY = ['concierge-escalations'] as const;
const caseKey = (id: number) => ['concierge-escalations', id] as const;

/** Admin queue. `status` narrows it; omit it to see every case, unresolved first. */
export function useConciergeEscalationQueue(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...QUEUE_KEY, params ?? {}],
    queryFn: () => conciergeEscalationService.list(params),
    // Polled: the queue page is not a member of any push channel.
    refetchInterval: 30_000,
  });
}

/** The full case (escalation row + transcript) the admin reads before acting. */
export function useConciergeEscalationDetail(id: number) {
  return useQuery({
    queryKey: caseKey(id),
    queryFn: () => conciergeEscalationService.getById(id),
    enabled: Number.isFinite(id),
  });
}

export function useClaimConciergeEscalation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => conciergeEscalationService.claim(id),
    onSuccess: (escalation: ConciergeEscalation) => {
      void queryClient.invalidateQueries({ queryKey: QUEUE_KEY });
      void queryClient.invalidateQueries({ queryKey: caseKey(escalation.id) });
    },
  });
}

export function useResolveConciergeEscalation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => conciergeEscalationService.resolve(id),
    onSuccess: (escalation: ConciergeEscalation) => {
      void queryClient.invalidateQueries({ queryKey: QUEUE_KEY });
      void queryClient.invalidateQueries({ queryKey: caseKey(escalation.id) });
    },
  });
}
