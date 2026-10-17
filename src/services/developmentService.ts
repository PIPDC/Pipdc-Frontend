import { api } from './api';
import type {
  DevelopmentProject,
  DevelopmentProjectDetail,
  DevelopmentProjectFilters,
  DevelopmentTrackingFilters,
  DevelopmentUnit,
  DevelopmentUpdate,
  AdminDevelopmentTracking,
  PaginatedDevelopmentProjects,
  PaginatedDevelopmentTracking,
  PaginatedAdminDevelopmentTracking,
} from '../types/development';

export const developmentService = {
  // ── Public Browse ──────────────────────────────────────────────────────
  async browse(filters?: DevelopmentProjectFilters): Promise<PaginatedDevelopmentProjects> {
    const { data } = await api.get<PaginatedDevelopmentProjects>('/development-projects/browse', { params: filters });
    return data;
  },
  async getPublicBySlug(slug: string): Promise<DevelopmentProjectDetail> {
    const { data } = await api.get<DevelopmentProjectDetail>(`/development-projects/browse/${slug}`);
    return data;
  },
  async getPublicById(id: number): Promise<DevelopmentProjectDetail> {
    const { data } = await api.get<DevelopmentProjectDetail>(`/development-projects/browse/${id}`);
    return data;
  },

  // ── Admin Projects ─────────────────────────────────────────────────────
  async list(filters?: DevelopmentProjectFilters): Promise<PaginatedDevelopmentProjects> {
    const { data } = await api.get<PaginatedDevelopmentProjects>('/development-projects', { params: filters });
    return data;
  },
  async getById(id: number): Promise<DevelopmentProjectDetail> {
    const { data } = await api.get<DevelopmentProjectDetail>(`/development-projects/${id}`);
    return data;
  },
  async create(payload: Record<string, unknown>): Promise<DevelopmentProject> {
    const { data } = await api.post<DevelopmentProject>('/development-projects', payload);
    return data;
  },
  async update(id: number, payload: Record<string, unknown>): Promise<DevelopmentProject> {
    const { data } = await api.put<DevelopmentProject>(`/development-projects/${id}`, payload);
    return data;
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/development-projects/${id}`);
  },
  async setFeatured(id: number, featured: boolean): Promise<DevelopmentProject> {
    const { data } = await api.put<DevelopmentProject>(`/development-projects/${id}/featured`, { featured });
    return data;
  },

  // ── Admin Units (nested under project) ─────────────────────────────────
  async listUnits(projectId: number): Promise<DevelopmentUnit[]> {
    const { data } = await api.get<DevelopmentUnit[]>(`/development-projects/${projectId}/units`);
    return data;
  },
  async createUnit(projectId: number, payload: Record<string, unknown>): Promise<DevelopmentUnit> {
    const { data } = await api.post<DevelopmentUnit>(`/development-projects/${projectId}/units`, payload);
    return data;
  },
  async updateUnit(projectId: number, unitId: number, payload: Record<string, unknown>): Promise<DevelopmentUnit> {
    const { data } = await api.put<DevelopmentUnit>(`/development-projects/${projectId}/units/${unitId}`, payload);
    return data;
  },
  /** Turns a ready unit into its own listing. Idempotent. */
  async promoteUnit(projectId: number, unitId: number): Promise<DevelopmentUnit> {
    const { data } = await api.post<DevelopmentUnit>(`/development-projects/${projectId}/units/${unitId}/promote`);
    return data;
  },
  async deleteUnit(projectId: number, unitId: number): Promise<void> {
    await api.delete(`/development-projects/${projectId}/units/${unitId}`);
  },

  // ── Admin Updates (nested under project) ───────────────────────────────
  async listUpdates(projectId: number): Promise<DevelopmentUpdate[]> {
    const { data } = await api.get<DevelopmentUpdate[]>(`/development-projects/${projectId}/updates`);
    return data;
  },
  async createUpdate(projectId: number, payload: Record<string, unknown>): Promise<DevelopmentUpdate> {
    const { data } = await api.post<DevelopmentUpdate>(`/development-projects/${projectId}/updates`, payload);
    return data;
  },
  async updateUpdate(projectId: number, updateId: number, payload: Record<string, unknown>): Promise<DevelopmentUpdate> {
    const { data } = await api.put<DevelopmentUpdate>(`/development-projects/${projectId}/updates/${updateId}`, payload);
    return data;
  },
  async deleteUpdate(projectId: number, updateId: number): Promise<void> {
    await api.delete(`/development-projects/${projectId}/updates/${updateId}`);
  },

  // ── Client Tracking ────────────────────────────────────────────────────
  async getTracked(filters?: DevelopmentProjectFilters): Promise<PaginatedDevelopmentTracking> {
    const { data } = await api.get<PaginatedDevelopmentTracking>('/development-tracking', { params: filters });
    return data;
  },
  async track(projectId: number, unitId?: number): Promise<void> {
    await api.post('/development-tracking', { projectId, unitId });
  },
  async stopTracking(projectId: number): Promise<void> {
    await api.delete(`/development-tracking/${projectId}`);
  },

  // ── Admin Tracking ─────────────────────────────────────────────────────
  async adminListTracking(filters?: DevelopmentTrackingFilters): Promise<PaginatedAdminDevelopmentTracking> {
    const { data } = await api.get<PaginatedAdminDevelopmentTracking>('/admin/development-tracking', { params: filters });
    return data;
  },
  async adminGetTrackingByProject(projectId: number): Promise<AdminDevelopmentTracking[]> {
    const { data } = await api.get<AdminDevelopmentTracking[]>(`/admin/development-tracking/project/${projectId}`);
    return data;
  },
  async adminGetTrackingByUser(userId: string): Promise<AdminDevelopmentTracking[]> {
    const { data } = await api.get<AdminDevelopmentTracking[]>(`/admin/development-tracking/user/${userId}`);
    return data;
  },
  async adminRemoveTracking(trackingId: number): Promise<void> {
    await api.delete(`/admin/development-tracking/${trackingId}`);
  },
  async adminUpdateTrackingStatus(trackingId: number, status: string): Promise<void> {
    await api.put(`/admin/development-tracking/${trackingId}/status`, { status });
  },
};
