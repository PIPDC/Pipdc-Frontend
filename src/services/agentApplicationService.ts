import { api } from './api';

export type AgentApplicationStatus = 'Submitted' | 'UnderReview' | 'Approved' | 'Rejected';

export interface AgentApplication {
  id: number;
  status: AgentApplicationStatus;
  createdAt: string;
  fullName: string;
  stateOfOrigin: string;
  residentialAddress: string;
  localGovernmentArea: string;
  phoneNumber: string;
  agencyName?: string | null;
  additionalNotes?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

export interface AgentApplicationReview extends AgentApplication {
  userId: string;
  applicantEmail: string;
  /** Null when the applicant never confirmed their address; the approval email cannot reach them. */
  applicantEmailConfirmed: string | null;
  reviewedByAdminId?: string | null;
}

export interface AgentApplicationPayload {
  fullName: string;
  stateOfOrigin: string;
  residentialAddress: string;
  localGovernmentArea: string;
  phoneNumber: string;
  agencyName?: string;
  additionalNotes?: string;
}

/**
 * The backend returns { items, totalCount, page, pageSize }. This is deliberately
 * not the shared Paginated<T> shape the other list endpoints use, because that
 * one carries pageNumber/totalPages/hasNextPage. Kept local rather than widening
 * the shared type for one caller.
 */
export interface PagedApplications {
  items: AgentApplicationReview[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const agentApplicationService = {
  async submit(payload: AgentApplicationPayload): Promise<AgentApplication> {
    const { data } = await api.post<AgentApplication>('/agent-applications', payload);
    return data;
  },

  async getCurrent(): Promise<AgentApplication | null> {
    const { data } = await api.get<AgentApplication | null>('/agent-applications/current');
    return data;
  },

  async getMine(): Promise<AgentApplication[]> {
    const { data } = await api.get<AgentApplication[]>('/agent-applications/mine');
    return data;
  },

  async listForReview(params: {
    page?: number;
    pageSize?: number;
    status?: AgentApplicationStatus;
  }): Promise<PagedApplications> {
    const { data } = await api.get<PagedApplications>('/agent-applications', { params });
    return data;
  },

  async startReview(id: number): Promise<AgentApplicationReview> {
    const { data } = await api.post<AgentApplicationReview>(`/agent-applications/${id}/start-review`);
    return data;
  },

  /**
   * Approves the application: grants the Agent role and issues a licence. Does
   * not verify the agent; that is a separate admin action.
   */
  async approve(id: number): Promise<AgentApplicationReview> {
    const { data } = await api.post<AgentApplicationReview>(`/agent-applications/${id}/approve`);
    return data;
  },

  async reject(id: number, reason: string): Promise<AgentApplicationReview> {
    const { data } = await api.post<AgentApplicationReview>(`/agent-applications/${id}/reject`, { reason });
    return data;
  },
};
