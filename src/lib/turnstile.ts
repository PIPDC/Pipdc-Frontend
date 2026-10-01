/**
 * Whether the Turnstile challenge is presented to users.
 *
 * Set VITE_TURNSTILE_ENABLED=false to hide the widget and stop gating the
 * register and forgot-password forms on a token. This must stay in sync with the
 * backend's `Turnstile:Enabled` user-secret / config flag: the backend's
 * kill-switch makes verification succeed immediately when disabled, so leaving
 * this on would render a challenge whose result is ignored.
 *
 * Turnstile requires a hostname you control, so it stays off until a domain is
 * purchased. See the audit recommendation to re-enable both sides together.
 */
export const turnstileEnabled = import.meta.env.VITE_TURNSTILE_ENABLED !== 'false';
