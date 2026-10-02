import { useQuery } from '@tanstack/react-query';
import { propertyService } from '../services/propertyService';
import { useAuth } from '../contexts/AuthContext';
import type { NearbyProperties } from '../types';

/**
 * Batch 5: "Properties Near You".
 *
 * This lives in its own file rather than in hooks/queries.ts, which is protected
 * uncommitted work and must not be edited.
 *
 * The endpoint is authenticated and the server works out whose location to use
 * from the token, so the hook is disabled for signed-out visitors instead of
 * firing a request that would only 401.
 */
export const nearbyPropertiesKey = ['properties', 'nearby'] as const;

export function useNearbyProperties(enabled: boolean) {
  const { isAuthenticated, isRestoring } = useAuth();

  const canFetch = enabled && isAuthenticated && !isRestoring;

  return useQuery<NearbyProperties>({
    queryKey: nearbyPropertiesKey,
    queryFn: () => propertyService.nearby(),
    enabled: canFetch,
    // Location only changes when the user edits it in settings, so a long stale
    // window is safe and avoids refetching on every home page visit.
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
