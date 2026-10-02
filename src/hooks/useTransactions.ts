import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services/transactionService';
import type { RecordLeasePayload, RecordSalePayload, TransactionFilters } from '../types';

/** Batch 7 hooks. Kept separate from `queries.ts` for the same reason as escalation. */
const TRANSACTIONS_KEY = ['transactions'] as const;

const transactionKeys = {
  all: TRANSACTIONS_KEY,
  list: (filters?: TransactionFilters) => [...TRANSACTIONS_KEY, 'list', filters ?? {}] as const,
  byProperty: (propertyId: number) => [...TRANSACTIONS_KEY, 'property', propertyId] as const,
  analytics: (from?: string, to?: string) => [...TRANSACTIONS_KEY, 'analytics', { from, to }] as const,
};

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => transactionService.list(filters),
  });
}

export function usePropertyTransaction(propertyId: number | undefined) {
  return useQuery({
    queryKey: transactionKeys.byProperty(propertyId ?? 0),
    queryFn: () => transactionService.getByProperty(propertyId as number),
    enabled: propertyId != null,
    // 404 simply means this property has no deal recorded yet, which is a normal
    // state rather than a failure, so it is not worth retrying.
    retry: false,
  });
}

export function useTransactionAnalytics(from?: string, to?: string) {
  return useQuery({
    queryKey: transactionKeys.analytics(from, to),
    queryFn: () => transactionService.analytics(from, to),
  });
}

function useInvalidateTransactions() {
  const queryClient = useQueryClient();
  return (propertyId?: number) => {
    void queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    if (propertyId != null) {
      void queryClient.invalidateQueries({ queryKey: transactionKeys.byProperty(propertyId) });
      // Recording a deal changes the property's own status to Sold/Rented, so the
      // property list and detail caches are stale too.
      void queryClient.invalidateQueries({ queryKey: ['properties'] });
    }
  };
}

export function useRecordSale() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ propertyId, payload, idempotencyKey }: { propertyId: number; payload: RecordSalePayload; idempotencyKey: string }) =>
      transactionService.recordSale(propertyId, payload, idempotencyKey),
    onSuccess: (_data, { propertyId }) => invalidate(propertyId),
  });
}

export function useRecordLease() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ propertyId, payload, idempotencyKey }: { propertyId: number; payload: RecordLeasePayload; idempotencyKey: string }) =>
      transactionService.recordLease(propertyId, payload, idempotencyKey),
    onSuccess: (_data, { propertyId }) => invalidate(propertyId),
  });
}
