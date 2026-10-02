import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  agentReportService,
  type AgentReportFilters,
  type CreateAgentReportPayload,
  type CreateAgentReviewPayload,
} from '../services/agentReportService';
import type { AgentReportStatus } from '../services/agentReportService';

// Kept in its own module rather than in queries.ts, which is protected for this
// batch, so no existing query keys or hooks are disturbed.

export const agentReportKeys = {
  all: ['agent-reports'] as const,
  list: (filters?: AgentReportFilters) => ['agent-reports', 'list', filters ?? {}] as const,
  mine: ['agent-reports', 'mine'] as const,
  reviews: (agentId: number) => ['agent-reviews', agentId] as const,
  myReview: (agentId: number) => ['agent-reviews', agentId, 'mine'] as const,
};

export function useAgentReports(filters?: AgentReportFilters) {
  return useQuery({
    queryKey: agentReportKeys.list(filters),
    queryFn: () => agentReportService.listReports(filters),
  });
}

export function useMyReports() {
  return useQuery({
    queryKey: agentReportKeys.mine,
    queryFn: () => agentReportService.getMyReports(),
  });
}

export function useAgentReviews(agentId: number | null | undefined) {
  return useQuery({
    queryKey: agentReportKeys.reviews(agentId ?? 0),
    queryFn: () => agentReportService.getReviewsForAgent(agentId as number),
    enabled: Boolean(agentId),
  });
}

export function useMyAgentReview(agentId: number | null | undefined) {
  return useQuery({
    queryKey: agentReportKeys.myReview(agentId ?? 0),
    queryFn: () => agentReportService.getMyReview(agentId as number),
    enabled: Boolean(agentId),
  });
}

/**
 * Invalidates the queues a moderation action changes. The agent list is included
 * because suspending hides an agent from the public directory, which changes both
 * the admin table and anything keyed on agents.
 */
function useInvalidateReportsAndAgents() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: agentReportKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['agents'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useSubmitAgentReport() {
  const invalidate = useInvalidateReportsAndAgents();
  return useMutation({
    mutationFn: (payload: CreateAgentReportPayload) => agentReportService.submitReport(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateAgentReportStatus() {
  const invalidate = useInvalidateReportsAndAgents();
  return useMutation({
    mutationFn: ({
      id,
      status,
      resolutionNote,
    }: {
      id: number;
      status: AgentReportStatus;
      resolutionNote?: string | null;
    }) => agentReportService.updateReportStatus(id, { status, resolutionNote }),
    onSuccess: invalidate,
  });
}

export function useSubmitAgentReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAgentReviewPayload) => agentReportService.submitReview(payload),
    onSuccess: (_data, payload) => {
      // Refresh both the public aggregate on the profile and the caller's own
      // review so the star control reflects what was just saved.
      void queryClient.invalidateQueries({ queryKey: agentReportKeys.reviews(payload.agentId) });
      void queryClient.invalidateQueries({ queryKey: agentReportKeys.myReview(payload.agentId) });
      void queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useSuspendAgent() {
  const invalidate = useInvalidateReportsAndAgents();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => agentReportService.suspendAgent(id, reason),
    onSuccess: invalidate,
  });
}

export function useReinstateAgent() {
  const invalidate = useInvalidateReportsAndAgents();
  return useMutation({
    mutationFn: (id: number) => agentReportService.reinstateAgent(id),
    onSuccess: invalidate,
  });
}
