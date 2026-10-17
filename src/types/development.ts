// Types mirror the ASP.NET Core backend DTOs under /api/development-*.

import type { Paginated, PropertyType } from './index';

export type DevelopmentProjectStatus = 'Planned' | 'UnderConstruction' | 'NearCompletion' | 'Completed' | 'OnHold';

export type DevelopmentUnitStatus = 'Available' | 'Reserved' | 'Sold' | 'UnderConstruction';

export type DevelopmentTrackingStatus = 'Tracking' | 'Interested' | 'Contacted';

// ── Response DTOs ──────────────────────────────────────────────────────────

export interface DevelopmentProjectImage {
  id: number;
  url: string;
  publicId: string;
  isCover: boolean;
  displayOrder: number;
}

export interface DevelopmentProject {
  id: number;
  name: string;
  slug: string;
  description: string;
  location: string;
  locationRefId: number | null;
  developer: string | null;
  status: DevelopmentProjectStatus;
  expectedCompletionDate: string | null;
  progressPercentage: number;
  featured: boolean;
  images: DevelopmentProjectImage[];
  unitCount: number;
  updateCount: number;
  /**
   * Legacy link to the listing this project represents. The edit form has to send
   * the current value back, otherwise saving an unrelated field silently unlinks it.
   */
  propertyId?: number | null;
  propertyTitle?: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface DevelopmentProjectDetail extends DevelopmentProject {
  units: DevelopmentUnit[];
  updates: DevelopmentUpdate[];
  /**
   * A project is the estate, not a house, so it is never listed itself. This legacy
   * link is kept only so the edit form preserves it when saving an unrelated field.
   */
  propertyId?: number | null;
  propertyTitle?: string | null;
  propertySlug?: string | null;
  propertyStatus?: string | null;
}

export interface DevelopmentUnit {
  id: number;
  unitIdentifier: string;
  unitType: string;
  status: DevelopmentUnitStatus;
  price: number | null;
  currency: string;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
  // ── Listing descriptor ────────────────────────────────────────────────
  // A unit is the individual house, so it carries the fields a listing needs.
  listingType: 'ForSale' | 'ForLease';
  propertyType: PropertyType;
  period: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size: number | null;
  sizeUnit: string;
  yearBuilt: number | null;
  amenities: string[];
  // ── Promotion state ───────────────────────────────────────────────────
  propertyId: number | null;
  propertyStatus: string | null;
  /** True once the unit has enough detail to become a listing. */
  isListable: boolean;
  /** Which fields are still needed, so the UI can say what to fill in. */
  missingDetails: string[];
}

export interface DevelopmentUpdate {
  id: number;
  title: string;
  description: string;
  progressPercentage: number | null;
  updateDate: string;
  imageUrls: string[];
  imagePublicIds: string[];
  createdAt: string;
  updatedAt: string | null;
}

export interface DevelopmentTracking {
  id: number;
  developmentProjectId: number;
  developmentProjectName: string;
  developmentUnitId: number | null;
  developmentUnitIdentifier: string | null;
  status: DevelopmentTrackingStatus;
  trackedAt: string;
}

export interface AdminDevelopmentTracking extends DevelopmentTracking {
  userId: string;
  userFullName: string;
  userEmail: string;
}

// ── Query / Filter params ──────────────────────────────────────────────────

export interface DevelopmentProjectFilters {
  keyword?: string;
  status?: DevelopmentProjectStatus;
  featured?: boolean;
  locationId?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface DevelopmentTrackingFilters {
  projectId?: number;
  userId?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ── Paginated re-exports ───────────────────────────────────────────────────

export type PaginatedDevelopmentProjects = Paginated<DevelopmentProject>;
export type PaginatedDevelopmentTracking = Paginated<DevelopmentTracking>;
export type PaginatedAdminDevelopmentTracking = Paginated<AdminDevelopmentTracking>;
