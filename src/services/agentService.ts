import { api } from './api';
import type { Agent, AgentSummary, Paginated } from '../types';

export interface AgentFilters {
  keyword?: string;
  isVerified?: boolean;
  sortBy?: string;
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

/**
 * Removing an agent is a revocation, not a delete. The reason is mandatory
 * because the agent is emailed it, and the successor is the admin's choice: the
 * agent's listings and open enquiries are handed to them so no client is
 * stranded, and choosing nobody leaves the listings hidden until then.
 */
export interface RemoveAgentPayload {
  reason: string;
  reassignToAgentId?: number | null;
}

/** What the removal actually did, so the admin can see the outcome, not just a toast. */
export interface AgentRemovalResult {
  agentId: number;
  propertiesReassigned: number;
  enquiriesReassigned: number;
  reassigned: boolean;
  applicationRevoked: boolean;
  message: string;
}

export const agentService = {
  async list(params?: AgentFilters): Promise<Paginated<Agent>> {
    const { data } = await api.get<Paginated<Agent>>('/agents', { params });
    return data;
  },
  async getById(id: number): Promise<Agent> {
    const { data } = await api.get<Agent>(`/agents/${id}`);
    return data;
  },
  async me(): Promise<Agent> {
    const { data } = await api.get<Agent>('/agents/me');
    return data;
  },
  async create(payload: Record<string, unknown>): Promise<Agent> {
    const { data } = await api.post<Agent>('/agents', payload);
    return data;
  },
  async update(id: number, payload: Record<string, unknown>): Promise<Agent> {
    const { data } = await api.put<Agent>(`/agents/${id}`, payload);
    return data;
  },
  /**
   * Sends a DELETE with a body. Awkward in HTTP, but a bodyless revocation is
   * exactly the silent action that left the platform in an unexplainable state.
   */
  async remove(id: number, payload: RemoveAgentPayload): Promise<AgentRemovalResult> {
    const { data } = await api.delete<AgentRemovalResult>(`/agents/${id}`, { data: payload });
    return data;
  },
  async toggleVerification(id: number): Promise<Agent> {
    const { data } = await api.put<Agent>(`/agents/${id}/verify`);
    return data;
  },
  async getSummary(id: number): Promise<AgentSummary> {
    const { data } = await api.get<AgentSummary>(`/agents/${id}/summary`);
    return data;
  },
};
