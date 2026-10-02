import { api } from './api';
import type { NearbyProperties, Paginated, Property, PropertyFilters } from '../types';

export const propertyService = {
  async list(filters?: PropertyFilters): Promise<Paginated<Property>> {
    const { data } = await api.get<Paginated<Property>>('/properties', { params: filters });
    return data;
  },
  async featured(): Promise<Property[]> {
    const { data } = await api.get<Property[]>('/properties/featured');
    return data;
  },
  /** Authenticated only. The server derives whose location to use from the token. */
  async nearby(): Promise<NearbyProperties> {
    const { data } = await api.get<NearbyProperties>('/properties/nearby');
    return data;
  },
  async getBySlug(slug: string): Promise<Property> {
    const { data } = await api.get<Property>(`/properties/slug/${slug}`);
    return data;
  },
  async getById(id: number): Promise<Property> {
    const { data } = await api.get<Property>(`/properties/${id}`);
    return data;
  },
  async similar(id: number): Promise<Property[]> {
    const { data } = await api.get<Property[]>(`/properties/${id}/similar`);
    return data;
  },
  async create(payload: Record<string, unknown>): Promise<Property> {
    const { data } = await api.post<Property>('/properties', payload);
    return data;
  },
  async update(id: number, payload: Record<string, unknown>): Promise<Property> {
    const { data } = await api.put<Property>(`/properties/${id}`, payload);
    return data;
  },
  async setFeatured(id: number, featured: boolean): Promise<Property> {
    const { data } = await api.put<Property>(`/properties/${id}/featured`, { featured });
    return data;
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/properties/${id}`);
  },
  async removeImage(id: number, publicId: string): Promise<void> {
    await api.delete(`/properties/${id}/images/${encodeURIComponent(publicId)}`);
  },
  async changeStatus(id: number, status: string): Promise<void> {
    await api.patch(`/properties/${id}/status`, { status });
  },
  async changeListingType(id: number, listingType: string): Promise<void> {
    await api.patch(`/properties/${id}/listing-type`, { listingType });
  },
  async assignAgent(id: number, agentId: number | null): Promise<void> {
    await api.put(`/properties/${id}/agent`, { agentId });
  },
};
