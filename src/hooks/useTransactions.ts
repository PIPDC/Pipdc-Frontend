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
  tenants: () => [...TRANSACTIONS_KEY, 'tenants'] as const,
  purchasers: () => [...TRANSACTIONS_KEY, 'purchasers'] as const,
  myTenancies: () => [...TRANSACTIONS_KEY, 'my-tenancies'] as const,
  myPurchases: () => [...TRANSACTIONS_KEY, 'my-purchases'] as const,
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

/** Current tenants across rented properties. Admin-only on the server. */
export function useTenants() {
  return useQuery({
    queryKey: transactionKeys.tenants(),
    queryFn: () => transactionService.tenants(),
  });
}

/** Clients who purchased a property. Admin-only on the server. */
export function usePurchasers() {
  return useQuery({
    queryKey: transactionKeys.purchasers(),
    queryFn: () => transactionService.purchasers(),
  });
}

/** The signed-in client's own tenancies. Scoped to the caller on the server. */
export function useMyTenancies() {
  return useQuery({
    queryKey: transactionKeys.myTenancies(),
    queryFn: () => transactionService.myTenancies(),
  });
}

/** The signed-in client's own purchases. Scoped to the caller on the server. */
export function useMyPurchases() {
  return useQuery({
    queryKey: transactionKeys.myPurchases(),
    queryFn: () => transactionService.myPurchases(),
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

/**
 * Emails a tenant the time left on their lease. [Idempotent] server-side, so the
 * service generates a fresh key per call; a retry of the same click replays.
 */
export function useNotifyTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leaseId: number) => transactionService.notifyTenant(leaseId, crypto.randomUUID()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });
}

/**
 * Extends a live tenancy. The property stays rented, so the property caches are
 * refreshed via the passed propertyId only to keep the tenant's lease dates in sync.
 */
export function useRenewLease() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ leaseId, newEndDate }: { leaseId: number; newEndDate: string; propertyId: number }) =>
      transactionService.renewLease(leaseId, newEndDate),
    onSuccess: (_data, { propertyId }) => invalidate(propertyId),
  });
}

/**
 * Ends a tenancy because the tenant has left. The property returns to Available,
 * so the property list and detail caches are invalidated via the passed propertyId.
 */
export function useEndLease() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ leaseId }: { leaseId: number; propertyId: number }) => transactionService.endLease(leaseId),
    onSuccess: (_data, { propertyId }) => invalidate(propertyId),
  });
}
