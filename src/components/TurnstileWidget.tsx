import { useEffect, useRef } from 'react';
import { turnstileLoader } from '../lib/turnstileLoader';
import { turnstileEnabled } from '../lib/turnstile';

export interface TurnstileVerification {
  token: string;
  idempotencyKey: string;
}

interface TurnstileWidgetProps {
  onVerification: (value: TurnstileVerification) => void;
  resetKey?: number;
}

export function TurnstileWidget({ onVerification, resetKey = 0 }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbackRef = useRef(onVerification);
  callbackRef.current = onVerification;

  useEffect(() => {
    // Disabled via VITE_TURNSTILE_ENABLED: render nothing and never load the
    // Cloudflare script. The form must also stop gating on the token, which the
    // register and forgot-password pages handle via the same flag.
    if (!turnstileEnabled) return;

    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    if (!siteKey) return;

    let cancelled = false;
    const idempotencyKey = crypto.randomUUID();

    void turnstileLoader
      .render(containerRef.current!, siteKey, idempotencyKey, (token) => {
        if (!cancelled) callbackRef.current({ token, idempotencyKey });
      })
      .then((id) => {
        widgetIdRef.current = id;
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current) turnstileLoader.reset(widgetIdRef.current);
    };
  }, [resetKey]);

  if (!turnstileEnabled) return null;

  return <div ref={containerRef} className="mt-4 flex justify-center" />;
}
