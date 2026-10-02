import { api } from './api';
import type { AgentReview, AgentReviewSummary, AgentReport, Paginated } from '../types';

export type AgentReportStatus = 'Open' | 'UnderReview' | 'Resolved' | 'Dismissed';

export type AgentReportReason =
  | 'FraudOrScam'
  | 'FalseListing'
  | 'Harassment'
  | 'UnprofessionalConduct'
  | 'PropertyNotAsAdvertised'
  | 'UnauthorizedPractice'
  | 'Other';

export interface AgentReportFilters {
  pageNumber?: number;
  pageSize?: number;
  status?: AgentReportStatus;
  agentId?: number;
}

export interface CreateAgentReportPayload {
  agentId: number;
  reason: AgentReportReason;
  description: string;
}

export interface CreateAgentReviewPayload {
  agentId: number;
  rating: number;
  comment?: string | null;
}

export interface AgentReportService {
  /** Files a report. The reporter is taken from the access token, never the body. */
  submitReport(payload: CreateAgentReportPayload): Promise<AgentReport>;
  /** The signed-in client's own reports and their outcomes. */
  getMyReports(): Promise<Paginated<AgentReport>>;
  /** Admin triage queue. */
  listReports(params?: AgentReportFilters): Promise<Paginated<AgentReport>>;
  getReport(id: number): Promise<AgentReport>;
  updateReportStatus(
    id: number,
    payload: { status: AgentReportStatus; resolutionNote?: string | null },
  ): Promise<AgentReport>;
  /** Public review list plus the rating aggregate. */
  getReviewsForAgent(agentId: number): Promise<AgentReviewSummary>;
  /** Creates the review, or updates it if the client already reviewed this agent. */
  submitReview(payload: CreateAgentReviewPayload): Promise<AgentReview>;
  getMyReview(agentId: number): Promise<AgentReview | null>;
  suspendAgent(id: number, reason: string): Promise<unknown>;
  reinstateAgent(id: number): Promise<unknown>;
}

export const agentReportService: AgentReportService = {
  async submitReport(payload) {
    const { data } = await api.post<AgentReport>('/agent-reports', payload);
    return data;
  },
  async getMyReports() {
    const { data } = await api.get<Paginated<AgentReport>>('/agent-reports/mine');
    return data;
  },
  async listReports(params) {
    const { data } = await api.get<Paginated<AgentReport>>('/agent-reports', { params });
    return data;
  },
  async getReport(id) {
    const { data } = await api.get<AgentReport>(`/agent-reports/${id}`);
    return data;
  },
  async updateReportStatus(id, payload) {
    const { data } = await api.patch<AgentReport>(`/agent-reports/${id}/status`, payload);
    return data;
  },
  async getReviewsForAgent(agentId) {
    const { data } = await api.get<AgentReviewSummary>(`/agent-reviews/${agentId}`);
    return data;
  },
  async submitReview(payload) {
    const { data } = await api.post<AgentReview>('/agent-reviews', payload);
    return data;
  },
  async getMyReview(agentId) {
    const { data } = await api.get<AgentReview | null>(`/agent-reviews/${agentId}/mine`);
    return data;
  },
  async suspendAgent(id, reason) {
    const { data } = await api.post(`/agents/${id}/suspension`, { reason });
    return data;
  },
  async reinstateAgent(id) {
    const { data } = await api.delete(`/agents/${id}/suspension`);
    return data;
  },
};

/** Human-readable labels for the moderation queue. */
export const AGENT_REPORT_REASON_LABELS: Record<AgentReportReason, string> = {
  FraudOrScam: 'Fraud or scam',
  FalseListing: 'False or misleading listing',
  Harassment: 'Harassment or unwanted contact',
  UnprofessionalConduct: 'Unprofessional conduct',
  PropertyNotAsAdvertised: 'Property not as advertised',
  UnauthorizedPractice: 'Unlicensed practice',
  Other: 'Other',
};

export const AGENT_REPORT_STATUS_LABELS: Record<AgentReportStatus, string> = {
  Open: 'Open',
  UnderReview: 'Under review',
  Resolved: 'Resolved',
  Dismissed: 'Dismissed',
};
