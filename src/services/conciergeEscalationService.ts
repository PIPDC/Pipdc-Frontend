import { api } from './api';
import type {
  ConciergeEscalation,
  ConciergeEscalationDetail,
  Paginated,
} from '../types';

/**
 * Admin queue of AI-assistant chats handed to PIPDC. Read-only transcript plus
 * claim/resolve: there is no in-chat takeover, the concierge keeps answering a
 * client who keeps chatting.
 */
export const conciergeEscalationService = {
  async list(params?: Record<string, unknown>): Promise<Paginated<ConciergeEscalation>> {
    const { data } = await api.get<Paginated<ConciergeEscalation>>('/concierge-escalations', { params });
    return data;
  },

  async getById(id: number): Promise<ConciergeEscalationDetail> {
    const { data } = await api.get<ConciergeEscalationDetail>(`/concierge-escalations/${id}`);
    return data;
  },

  /** An administrator takes ownership. Only an `Escalated` case can be claimed. */
  async claim(id: number): Promise<ConciergeEscalation> {
    const { data } = await api.post<ConciergeEscalation>(`/concierge-escalations/${id}/claim`);
    return data;
  },

  /** The owning administrator closes the case. History is retained. */
  async resolve(id: number): Promise<ConciergeEscalation> {
    const { data } = await api.post<ConciergeEscalation>(`/concierge-escalations/${id}/resolve`);
    return data;
  },
};
