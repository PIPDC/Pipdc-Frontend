import { api } from './api';
import type {
  Paginated,
  RecordLeasePayload,
  RecordSalePayload,
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
};
