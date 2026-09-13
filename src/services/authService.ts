import { api } from './api';
import type { AuthResponse, AuthUser } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface TurnstileVerification {
  token: string;
  idempotencyKey: string;
}

function turnstileHeaders(t?: TurnstileVerification): Record<string, string> | undefined {
  return t?.token
    ? {
        'X-Turnstile-Token': t.token,
        'X-Turnstile-Idempotency-Key': t.idempotencyKey,
        'Idempotency-Key': t.idempotencyKey,
      }
    : undefined;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },
  async register(payload: RegisterPayload, turnstile?: TurnstileVerification): Promise<void> {
    await api.post('/auth/register', payload, { headers: turnstileHeaders(turnstile) });
  },
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
    return data;
  },
  async revoke(refreshToken: string): Promise<void> {
    try {
      await api.post('/auth/revoke', { refreshToken });
    } catch {
      // Best-effort revoke.
    }
  },
  async forgotPassword(email: string, turnstile?: TurnstileVerification): Promise<void> {
    await api.post('/auth/forgot-password', { email }, { headers: turnstileHeaders(turnstile) });
  },
  async verifyEmail(payload: { email: string; code: string }): Promise<void> {
    await api.post('/auth/verify-email', payload);
  },
  async resendVerification(email: string, idempotencyKey: string = crypto.randomUUID()): Promise<void> {
    await api.post('/auth/resend-verification', { email }, { headers: { 'Idempotency-Key': idempotencyKey } });
  },
  async resetPassword(payload: { email: string; code: string; newPassword: string }): Promise<void> {
    await api.post('/auth/reset-password', payload);
  },
  async me(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/auth/me');
    return data;
  },
  async updateProfile(payload: { firstName: string; lastName: string; phoneNumber?: string | null }): Promise<AuthUser> {
    const { data } = await api.put<AuthUser>('/auth/me', payload);
    return data;
  },
  async addRole(payload: { email: string; role: string }): Promise<void> {
    await api.post('/auth/add-role', payload);
  },
  async removeRole(payload: { email: string; role: string }): Promise<void> {
    await api.post('/auth/remove-role', payload);
  },
  async changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.post('/auth/change-password', payload);
  },
};
