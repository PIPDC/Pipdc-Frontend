import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  agentApplicationService,
  type AgentApplicationPayload,
  type AgentApplicationStatus,
  type PagedApplications,
} from '../services/agentApplicationService';

export const AGENT_APPLICATIONS_KEY = ['agent-applications'] as const;

/** The caller's own most recent application, used to gate the apply form. */
export function useMyCurrentApplication() {
  return useQuery({
    queryKey: [...AGENT_APPLICATIONS_KEY, 'current'],
    queryFn: () => agentApplicationService.getCurrent(),
  });
}

export function useSubmitAgentApplication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AgentApplicationPayload) => agentApplicationService.submit(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...AGENT_APPLICATIONS_KEY, 'current'] });
      void qc.invalidateQueries({ queryKey: [...AGENT_APPLICATIONS_KEY, 'mine'] });
    },
  });
}

export function useAgentApplicationsForReview(params: {
  page: number;
  pageSize: number;
  status?: AgentApplicationStatus;
}) {
  return useQuery({
    queryKey: [...AGENT_APPLICATIONS_KEY, 'review', params.page, params.pageSize, params.status ?? 'all'],
    queryFn: () => agentApplicationService.listForReview(params),
  });
}

/**
 * Shared invalidation for every review transition, since all of them change what
 * the admin list and the applicant's own view should show.
 */
function useInvalidateApplications() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: AGENT_APPLICATIONS_KEY });
    // Approval creates an Agent row, so the agent directory and dashboard counts
    // are stale until refetched.
    void qc.invalidateQueries({ queryKey: ['agents'] });
    void qc.invalidateQueries({ queryKey: ['dashboard'] });
    void qc.invalidateQueries({ queryKey: ['users'] });
  };
}

export function useStartReview() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (id: number) => agentApplicationService.startReview(id),
    onSuccess: invalidate,
  });
}

export function useApproveAgentApplication() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (id: number) => agentApplicationService.approve(id),
    onSuccess: invalidate,
  });
}

export function useRejectAgentApplication() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => agentApplicationService.reject(id, reason),
    onSuccess: invalidate,
  });
}

export type { PagedApplications };
