import { api } from './api';
import type { AiChatSession, SendAiMessageResponse } from '../types';

export const aiChatService = {
  async getSession(): Promise<AiChatSession> {
    const { data } = await api.get<AiChatSession>('/ai-chat/session');
    return data;
  },
  async sendMessage(content: string): Promise<SendAiMessageResponse> {
    const { data } = await api.post<SendAiMessageResponse>('/ai-chat/session/messages', { content });
    return data;
  },
  async clearSession(): Promise<void> {
    await api.delete('/ai-chat/session');
  },
};