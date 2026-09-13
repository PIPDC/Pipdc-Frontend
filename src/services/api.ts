import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorBody } from '../types';

const ACCESS_KEY = 'pipdc_access_token';
const REFRESH_KEY = 'pipdc_refresh_token';

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setAccess: (token: string) => localStorage.setItem(ACCESS_KEY, token),
  setRefresh: (token: string) => localStorage.setItem(REFRESH_KEY, token),
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  hasSession: () => Boolean(localStorage.getItem(ACCESS_KEY)) && Boolean(localStorage.getItem(REFRESH_KEY)),
};

export const baseURL = import.meta.env.VITE_API_URL ?? '/api';

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<RefreshResponse>(`${baseURL}/auth/refresh`, { refreshToken });
    tokenStore.setAccess(data.accessToken);
    tokenStore.setRefresh(data.refreshToken);
    return data.accessToken;
  } catch {
    tokenStore.clear();
    return null;
  }
}

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      const accessToken = await refreshAccessToken();
      if (accessToken) {
        original._retry = true;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      }
    }

    return Promise.reject(error);
  },
);

export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (typeof body?.detail === 'string' && body.detail) return body.detail;
    if (typeof body?.message === 'string' && body.message) return body.message;
    if (typeof body?.title === 'string' && body.title) return body.title;
    if (error.response?.status === 429) return 'Too many requests. Please slow down and try again shortly.';
    if (error.response?.status === 401) return 'Your session has expired. Please sign in again.';
    if (error.response?.status === 404) return 'The requested resource could not be found.';
    if (!error.response) return 'Unable to reach the server. Is the backend running?';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}

export function extractApiErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    return body?.code;
  }
  return undefined;
}

export const CONCURRENCY_CONFLICT_CODE = 'concurrency.conflict';

export function isConcurrencyConflict(error: unknown): boolean {
  return extractApiErrorCode(error) === CONCURRENCY_CONFLICT_CODE;
}

export const CONCURRENCY_CONFLICT_DESCRIPTION =
  'This item was changed by someone else. The latest version has been reloaded — please re-apply your changes and try again.';

export function isApiConfigured(): boolean {
  return Boolean(import.meta.env.VITE_API_URL);
}
