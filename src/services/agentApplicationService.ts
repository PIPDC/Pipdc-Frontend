import { api } from './api';

/** Revoked means the registration it granted has since been withdrawn by an admin. */
export type AgentApplicationStatus = 'Submitted' | 'UnderReview' | 'Approved' | 'Rejected' | 'Revoked';

export type AgentAppealStatus = 'Submitted' | 'UnderReview' | 'Refused' | 'Upheld';

export interface AgentApplication {
  id: number;
  status: AgentApplicationStatus;
  createdAt: string;
  fullName: string;
  phoneNumber: string;
  /** Date-only, sent as "YYYY-MM-DD". Null on rows predating the field. */
  dateOfBirth: string | null;
  stateOfOrigin: string;
  localGovernmentArea: string;
  residentialAddress: string;
  nationalIdentityNumber: string;
  yearsOfExperience?: number | null;
  agencyName?: string | null;
  additionalNotes?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  /** Set only while Revoked, so the applicant can be told why. */
  revocationReason?: string | null;
  revokedAt?: string | null;
}

export interface AgentApplicationReview extends AgentApplication {
  userId: string;
  applicantEmail: string;
  /** Null when the applicant never confirmed their address; the approval email cannot reach them. */
  applicantEmailConfirmed: string | null;
  reviewedByAdminId?: string | null;
}

/**
 * Whether the caller may apply right now. The apply form is hidden against this
 * rather than letting someone fill it in only to be refused.
 */
export interface AgentApplicationEligibility {
  canApply: boolean;
  isBlocked: boolean;
  /** Shown to the barred applicant so the bar is not a silent dead end. */
  blockedReason: string | null;
  isAgent: boolean;
  hasOpenApplication: boolean;
  hasRevokedRegistration: boolean;
  canAppeal: boolean;
  hasOpenAppeal: boolean;
}

export interface AgentAppeal {
  id: number;
  agentApplicationId: number | null;
  status: AgentAppealStatus;
  reason: string;
  createdAt: string;
  reviewedAt?: string | null;
  decisionNote?: string | null;
}

export interface AgentAppealReview extends AgentAppeal {
  userId: string;
  appellantName: string;
  appellantEmail: string;
  reviewedByAdminId?: string | null;
}

export interface AgentApplicationBlock {
  id: number;
  userId: string;
  fullName: string;
  email: string;
  reason: string;
  createdAt: string;
  /** The administrator who set the bar. Never null: attribution is the point. */
  blockedByAdminId: string;
  liftedAt?: string | null;
  liftedByAdminId?: string | null;
}

export interface AgentApplicationPayload {
  fullName: string;
  phoneNumber: string;
  /** "YYYY-MM-DD". The server re-validates that it is a real, past, adult date. */
  dateOfBirth: string;
  stateOfOrigin: string;
  localGovernmentArea: string;
  residentialAddress: string;
  /** Nigerian NIN: 11 digits. Separators the applicant typed are stripped server-side. */
  nationalIdentityNumber: string;
  yearsOfExperience: number;
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

export interface PagedAppeals {
  items: AgentAppealReview[];
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

  /** Drives the apply form: hidden fields, the bar notice, and whether to offer an appeal. */
  async getEligibility(): Promise<AgentApplicationEligibility> {
    const { data } = await api.get<AgentApplicationEligibility>('/agent-applications/eligibility');
    return data;
  },

  /**
   * Withdraws the caller's own rejected application so they can reapply. The
   * server refuses anything not in the Rejected state.
   */
  async withdrawRejected(): Promise<void> {
    await api.delete('/agent-applications/mine');
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

  /** Rejects and additionally bars the account from ever applying again. */
  async block(id: number, reason: string): Promise<void> {
    await api.post(`/agent-applications/${id}/block`, { reason });
  },

  async getMyAppeals(): Promise<AgentAppeal[]> {
    const { data } = await api.get<AgentAppeal[]>('/agent-applications/appeals/mine');
    return data;
  },

  /**
   * Appeals the revocation of the caller's own registration. No application id is
   * sent: the server resolves the revoked application from the token, so a
   * caller cannot appeal an application that is not theirs.
   */
  async submitAppeal(reason: string): Promise<AgentAppeal> {
    const { data } = await api.post<AgentAppeal>('/agent-applications/appeals', { reason });
    return data;
  },

  async listAppeals(params: {
    page?: number;
    pageSize?: number;
    status?: AgentAppealStatus;
  }): Promise<PagedAppeals> {
    const { data } = await api.get<PagedAppeals>('/agent-applications/appeals', { params });
    return data;
  },

  async getAppeal(id: number): Promise<AgentAppealReview> {
    const { data } = await api.get<AgentAppealReview>(`/agent-applications/appeals/${id}`);
    return data;
  },

  async startAppealReview(id: number): Promise<AgentAppealReview> {
    const { data } = await api.post<AgentAppealReview>(`/agent-applications/appeals/${id}/start-review`);
    return data;
  },

  /** Upholding reinstates the agent and restores their role. Refusing does not. */
  async decideAppeal(id: number, decision: 'Upheld' | 'Refused', note: string): Promise<AgentAppealReview> {
    const { data } = await api.post<AgentAppealReview>(`/agent-applications/appeals/${id}/decide`, {
      decision,
      note,
    });
    return data;
  },

  async listBlocks(): Promise<AgentApplicationBlock[]> {
    const { data } = await api.get<AgentApplicationBlock[]>('/agent-applications/blocks');
    return data;
  },

  async liftBlock(userId: string): Promise<void> {
    await api.post(`/agent-applications/blocks/${encodeURIComponent(userId)}/lift`);
  },
};
