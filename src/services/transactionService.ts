import { api } from './api';
import type {
  NotifyTenantResult,
  Paginated,
  PurchaserInfo,
  RecordLeasePayload,
  RecordSalePayload,
  TenantInfo,
  Transaction,
  TransactionAnalytics,
  TransactionFilters,
} from '../types';

/**
 * Batch 7. Recording a sale or tenancy is an attributed, irreversible act, so both
 * writes carry an `Idempotency-Key`: a double-click or a retried request replays
 * the original response instead of filing a second deal. The recorder identity and
 * the buyer/tenant account are both derived server-side from the JWT, which is why
 * these payloads contain no user ids.
 */
export const transactionService = {
  async recordSale(propertyId: number, payload: RecordSalePayload, idempotencyKey: string): Promise<Transaction> {
    const { data } = await api.post<Transaction>(`/transactions/properties/${propertyId}/sales`, payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return data;
  },

  async recordLease(propertyId: number, payload: RecordLeasePayload, idempotencyKey: string): Promise<Transaction> {
    const { data } = await api.post<Transaction>(`/transactions/properties/${propertyId}/leases`, payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return data;
  },

  async list(filters?: TransactionFilters): Promise<Paginated<Transaction>> {
    const { data } = await api.get<Paginated<Transaction>>('/transactions', { params: filters });
    return data;
  },

  async getByProperty(propertyId: number): Promise<Transaction> {
    const { data } = await api.get<Transaction>(`/transactions/properties/${propertyId}`);
    return data;
  },

  /** Every figure the dashboard charts render is aggregated by the server. */
  async analytics(from?: string, to?: string): Promise<TransactionAnalytics> {
    const { data } = await api.get<TransactionAnalytics>('/transactions/analytics', {
      params: { from, to },
    });
    return data;
  },

  /** Admin-only roster of current tenants across rented properties. */
  async tenants(): Promise<TenantInfo[]> {
    const { data } = await api.get<TenantInfo[]>('/transactions/tenants');
    return data;
  },

  /** Admin-only roster of clients who purchased a property. */
  async purchasers(): Promise<PurchaserInfo[]> {
    const { data } = await api.get<PurchaserInfo[]>('/transactions/purchasers');
    return data;
  },

  /** Admin-only. Emails a tenant the time left on their lease. */
  async notifyTenant(leaseId: number, idempotencyKey: string): Promise<NotifyTenantResult> {
    const { data } = await api.post<NotifyTenantResult>(
      `/transactions/leases/${leaseId}/notify`,
      undefined,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    return data;
  },
};
