import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { savedPropertyService } from '../services/savedPropertyService';
import { useAuth } from '../contexts/AuthContext';
import { queryKeys } from './queries';

const STORAGE_KEY = 'pipdc_favourites';

function readLocalFavourites(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.map(Number).filter((n) => Number.isFinite(n)) : [];
  } catch {
    return [];
  }
}

function persistLocalFavourites(ids: number[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useFavourites() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [localFavourites, setLocalFavourites] = useState<number[]>(readLocalFavourites);

  const { data: savedIds = [] } = useQuery({
    queryKey: queryKeys.savedIds,
    queryFn: savedPropertyService.ids,
    enabled: isAuthenticated,
  });

  const saveMutation = useMutation({
    mutationFn: savedPropertyService.save,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.savedProperties() });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
  const unsaveMutation = useMutation({
    mutationFn: savedPropertyService.unsave,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.savedProperties() });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const updateBackendIds = (updater: (ids: number[]) => number[]) => {
    queryClient.setQueryData(queryKeys.savedIds, updater);
  };

  const toggle = useCallback(
    (id: number) => {
      if (isAuthenticated) {
        const isSaved = savedIds.includes(id);
        if (isSaved) {
          unsaveMutation.mutate(id);
          updateBackendIds((ids) => ids.filter((x) => x !== id));
        } else {
          saveMutation.mutate(id);
          updateBackendIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
        }
      } else {
        setLocalFavourites((prev) => {
          const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
          persistLocalFavourites(next);
          return next;
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAuthenticated, savedIds],
  );

  const isFavourite = useCallback(
    (id: number) => (isAuthenticated ? savedIds.includes(id) : localFavourites.includes(id)),
    [isAuthenticated, savedIds, localFavourites],
  );

  return { favourites: isAuthenticated ? savedIds : localFavourites, toggle, isFavourite };
}
