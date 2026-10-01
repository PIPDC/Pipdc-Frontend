/// <reference types="vite/client" />

interface TurnstileApi {
  render(
    el: HTMLElement,
    options: {
      sitekey: string;
      idempotency_key?: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    },
  ): string;
  reset(widgetId: string): void;
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  /** Set to 'false' to hide the Turnstile widget and stop gating forms on a token. */
  readonly VITE_TURNSTILE_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  turnstile?: TurnstileApi;
}
