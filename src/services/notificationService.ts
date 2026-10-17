import { api } from './api';
import type { Notification } from '../types/notification';

export const notificationService = {
  async list(): Promise<Notification[]> {
    const { data } = await api.get<Notification[]>('/development-notifications');
    return data;
  },
  async markRead(id: number): Promise<void> {
    await api.post(`/development-notifications/${id}/mark-read`);
  },
};