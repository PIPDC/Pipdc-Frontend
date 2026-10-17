import { api } from './api';
import type { AiChatSession, ConciergeContactPreference, SendAiMessageResponse } from '../types';

export const aiChatService = {
  async getSession(): Promise<AiChatSession> {
    const { data } = await api.get<AiChatSession>('/ai-chat/session');
    return data;
  },
  async sendMessage(content: string): Promise<SendAiMessageResponse> {
    const { data } = await api.post<SendAiMessageResponse>('/ai-chat/session/messages', { content });
    return data;
  },
  /**
   * The client's answer to "how should the team reach you?", chosen after the
   * concierge staged a handoff. Opens the escalation case.
   */
  async submitContactPreference(choice: ConciergeContactPreference, phone?: string): Promise<SendAiMessageResponse> {
    const { data } = await api.post<SendAiMessageResponse>('/ai-chat/session/contact-preference', { choice, phone });
    return data;
  },
  async clearSession(): Promise<void> {
    await api.delete('/ai-chat/session');
  },
};