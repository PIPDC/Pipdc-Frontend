import { api } from './api';
import type { FirstMessageResult, Message } from '../types';

export const messageService = {
  async list(conversationId: number): Promise<Message[]> {
    const { data } = await api.get<Message[]>(`/conversations/${conversationId}/messages`);
    return data;
  },
  async send(conversationId: number, content: string, idempotencyKey?: string): Promise<Message> {
    const { data } = await api.post<Message>(`/conversations/${conversationId}/messages`, { content }, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    });
    return data;
  },
  async sendByEnquiry(enquiryId: number, content: string, idempotencyKey?: string): Promise<FirstMessageResult> {
    const { data } = await api.post<FirstMessageResult>(`/enquiries/${enquiryId}/messages`, { content }, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    });
    return data;
  },
  async markRead(conversationId: number): Promise<void> {
    await api.post(`/conversations/${conversationId}/messages/read`);
  },
};
