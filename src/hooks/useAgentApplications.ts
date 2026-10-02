import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  agentApplicationService,
  type AgentAppealStatus,
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

/**
 * Whether the caller may apply at all. Distinct from the current application: a
 * barred account has no application to show but still must not be offered a
 * form, and a revoked one needs an appeal rather than an application.
 */
export function useMyAgentApplicationEligibility() {
  return useQuery({
    queryKey: [...AGENT_APPLICATIONS_KEY, 'eligibility'],
    queryFn: () => agentApplicationService.getEligibility(),
  });
}

/** The caller's own appeals, newest first. */
export function useMyAgentAppeals() {
  return useQuery({
    queryKey: [...AGENT_APPLICATIONS_KEY, 'appeals', 'mine'],
    queryFn: () => agentApplicationService.getMyAppeals(),
  });
}

export function useSubmitAgentAppeal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (reason: string) => agentApplicationService.submitAppeal(reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...AGENT_APPLICATIONS_KEY, 'appeals', 'mine'] });
      void qc.invalidateQueries({ queryKey: [...AGENT_APPLICATIONS_KEY, 'eligibility'] });
    },
  });
}

/**
 * Withdraws the caller's own rejected application so they can reapply. The server
 * refuses anything not in the Rejected state, so a button is only ever offered
 * for a rejected application.
 */
export function useWithdrawAgentApplication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => agentApplicationService.withdrawRejected(),
    onSuccess: () => {
      // Clears the applicant's view outright rather than invalidating, so the
      // form reappears immediately instead of flashing the deleted application.
      qc.setQueryData([...AGENT_APPLICATIONS_KEY, 'current'], null);
      void qc.invalidateQueries({ queryKey: [...AGENT_APPLICATIONS_KEY, 'mine'] });
    },
  });
}

export function useSubmitAgentApplication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AgentApplicationPayload) => agentApplicationService.submit(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...AGENT_APPLICATIONS_KEY, 'current'] });
      void qc.invalidateQueries({ queryKey: [...AGENT_APPLICATIONS_KEY, 'mine'] });
      // A successful submission means the account is no longer eligible, so the
      // apply form has to be re-gated rather than left on screen.
      void qc.invalidateQueries({ queryKey: [...AGENT_APPLICATIONS_KEY, 'eligibility'] });
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

/**
 * Rejects and additionally bars the account. Separate from a plain rejection
 * because the bar is permanent: only an explicit lift clears it, so it must be a
 * deliberate second click rather than a side effect of rejecting.
 */
export function useBlockAgentApplication() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => agentApplicationService.block(id, reason),
    onSuccess: invalidate,
  });
}

export function useAgentAppealsForReview(params: {
  page: number;
  pageSize: number;
  status?: AgentAppealStatus;
}) {
  return useQuery({
    queryKey: [...AGENT_APPLICATIONS_KEY, 'appeals', 'review', params.page, params.pageSize, params.status ?? 'all'],
    queryFn: () => agentApplicationService.listAppeals(params),
  });
}

export function useStartAppealReview() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (id: number) => agentApplicationService.startAppealReview(id),
    onSuccess: invalidate,
  });
}

/** Upholding reinstates the agent and restores their role, so agents are invalidated too. */
export function useDecideAgentAppeal() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: ({ id, decision, note }: { id: number; decision: 'Upheld' | 'Refused'; note: string }) =>
      agentApplicationService.decideAppeal(id, decision, note),
    onSuccess: invalidate,
  });
}

export function useAgentApplicationBlocks() {
  return useQuery({
    queryKey: [...AGENT_APPLICATIONS_KEY, 'blocks'],
    queryFn: () => agentApplicationService.listBlocks(),
  });
}

export function useLiftAgentApplicationBlock() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (userId: string) => agentApplicationService.liftBlock(userId),
    onSuccess: invalidate,
  });
}

export type { PagedApplications };
