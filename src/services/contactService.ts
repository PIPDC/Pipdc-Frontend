import { api } from './api';

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export const contactService = {
  async submit(payload: ContactPayload): Promise<void> {
    await api.post('/contact', payload);
  },
};
