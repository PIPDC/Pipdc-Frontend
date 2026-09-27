import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import { baseURL, tokenStore } from '../services/api';

const HUB_PATH = '/hubs/messaging';

// The backend maps the messaging hub at the origin root, outside the /api route prefix.
const HUB_URL = `${baseURL.replace(/\/api(\/v\d+)?\/?$/, '')}${HUB_PATH}`;

interface RealtimeContextValue {
  connection: HubConnection | null;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const next = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => tokenStore.getAccess() ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
      .build();

    let cancelled = false;

    next.onreconnecting(() => {
      if (!cancelled) setIsConnected(false);
    });
    next.onreconnected(() => {
      if (!cancelled) setIsConnected(true);
    });
    next.onclose((error) => {
      if (!cancelled) setIsConnected(false);
      if (error) console.warn('[realtime] SignalR connection closed with an error.', error);
    });

    setConnection(next);

    next
      .start()
      .then(() => {
        if (!cancelled) setIsConnected(true);
      })
      .catch((error: unknown) => {
        console.error('[realtime] Failed to establish the SignalR connection.', error);
      });

    return () => {
      cancelled = true;
      setConnection(null);
      setIsConnected(false);
      next.stop().catch(() => undefined);
    };
  }, [isAuthenticated]);

  const value = useMemo(() => ({ connection, isConnected }), [connection, isConnected]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}
