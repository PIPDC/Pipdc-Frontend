// Types mirror the ASP.NET Core backend DTOs under /api.

export type PropertyStatus = 'Available' | 'Pending' | 'Sold' | 'Rented' | 'Unavailable';

export type PropertyType =
  | 'Detached House'
  | 'Semi-Detached'
  | 'Terrace'
  | 'Apartment'
  | 'Penthouse'
  | 'Villa'
  | 'Mansion'
  | 'Land'
  | 'Commercial'
  | 'Townhouse'
  | 'Residential'
  | 'Industrial'
  | 'Mixed';

export type LocationType = 'State' | 'LGA' | 'City' | 'Area';

export interface Location {
  id: number;
  name: string;
  slug: string;
  type: LocationType;
  parentId: number | null;
  parentName: string | null;
  childCount: number;
}

export interface Agent {
  id: number;
  bio: string | null;
  title: string | null;
  photo: string | null;
  photoPublicId: string | null;
  agency: string;
  licenseNumber: string | null;
  phone: string;
  verified: boolean;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  createdAt: string;
  propertyCount: number;
  /** Mean of published client ratings, or null when the agent has no reviews yet. */
  averageRating: number | null;
  reviewCount: number;
  /** Always false for public callers; only the admin directory sees true. */
  isSuspended: boolean;
  suspendedAt: string | null;
  suspensionReason: string | null;
  /**
   * Removed means the registration was revoked, not deleted. A removed agent keeps
   * their rows, reviews and reports, and can be reinstated by an upheld appeal.
   */
  isRemoved?: boolean;
  removedAt?: string | null;
  removalReason?: string | null;
  /** The agent who took over this one's listings, if they were handed on. */
  reassignedToAgentId?: number | null;
}

export interface AgentReport {
  id: number;
  agentId: number;
  agentName: string;
  agentAgency: string;
  reporterUserId: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string | null;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  resolutionNote: string | null;
}

export interface AgentReview {
  id: number;
  agentId: number;
  agentName: string;
  reviewerUserId: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface AgentReviewSummary {
  averageRating: number | null;
  reviewCount: number;
  reviews: AgentReview[];
}

export interface Property {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  period?: string | null;
  status: PropertyStatus;
  type: PropertyType;
  propertyType: string;
  listingType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  size: number | null;
  sizeUnit: string;
  lotSize?: number | null;
  yearBuilt?: number | null;
  address: string;
  city: string;
  area?: string | null;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  locationId?: number | null;
  images: string[];
  coverImage?: string | null;
  amenities: string[];
  featured: boolean;
  agentId: number | null;
  agentName: string | null;
  agentPhoto?: string | null;
  isSaved: boolean;
  enquiryCount: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface SavedProperty {
  property: Property;
  savedAt: string;
}

/** A nearby result: the usual property, plus how it was matched. */
export interface NearbyProperty {
  property: Property;
  /** Null when the match was by saved area rather than by real distance. */
  distanceKm: number | null;
  /** Pre-formatted label, e.g. "2.4 km away" or an area name. Null in area mode. */
  distanceLabel: string | null;
}

export interface NearbyProperties {
  items: NearbyProperty[];
  hasLocation: boolean;
  /** False means results are by saved area and no km figure can be trusted. */
  distanceAvailable: boolean;
  locationName: string | null;
  /** "distance" | "area" | "none" */
  mode: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  blogPostCount: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  blogPostCount: number;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  coverImagePublicId: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  readMinutes: number;
  keyQuote: string | null;
  categoryId: number | null;
  categoryName: string | null;
  authorUserId: string | null;
  authorName: string | null;
  tags: Tag[];
}

export type EnquiryStatus = 'Pending' | 'InProgress' | 'ViewingScheduled' | 'Resolved';

export interface Enquiry {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  message: string;
  status: EnquiryStatus;
  propertyId: number;
  propertyTitle: string;
  propertySlug: string;
  userId: string | null;
  agentId: number | null;
  agentName: string | null;
  agentReadAt: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface AgentEnquirySummary {
  agentId: number;
  agentName: string;
  totalEnquiries: number;
  unreadEnquiries: number;
  latestEnquiryAt: string | null;
}

export interface AgentNotifyResult {
  enquiryId: number;
  enquiryStatus: string;
  clientFullName: string;
  clientEmail: string;
  clientPhone: string | null;
  clientMessage: string;
  agentId: number | null;
  agentName: string | null;
  agentEmail: string | null;
  propertyId: number;
  propertyTitle: string;
  propertySlug: string;
  agentReadAt: string | null;
}

export interface ConversationClient {
  userId: string;
  fullName: string;
  email: string;
}

export interface ConversationAgent {
  agentId: number | null;
  userId: string | null;
  fullName: string;
  agencyName: string;
  photoUrl: string | null;
}

export interface ConversationProperty {
  propertyId: number;
  title: string;
  slug: string;
}

export interface Conversation {
  id: number;
  enquiryId: number;
  client: ConversationClient;
  agent: ConversationAgent;
  property: ConversationProperty;
  lastMessageAt: string | null;
  messageCount: number;
  unreadCount: number;
  createdAt: string;
  updatedAt: string | null;

  // Batch 6: escalation state. These arrive on every conversation, so a client
  // can render the right banner without a second request. The escalation fields
  // stay null for the ordinary case, where nobody has escalated anything.
  escalationStatus: ConversationEscalationStatus;
  escalationReason: string | null;
  escalatedAt: string | null;
  escalatedByName: string | null;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  assignedAt: string | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
}

/**
 * Batch 6. `Active` is an ordinary agent/client thread. `Escalated` means an
 * agent has handed it to PIPDC and nobody has picked it up yet. `Assigned` means
 * an administrator owns it, and the original agent is read-only from then on.
 * `Resolved` keeps the thread and its history but closes the case.
 */
export type ConversationEscalationStatus = 'Active' | 'Escalated' | 'Assigned' | 'Resolved';

export interface Message {
  id: number;
  conversationId: number;
  senderUserId: string;
  senderName: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  isRead: boolean;
}

export interface EnquiryConversationState {
  enquiryId: number;
  conversation: Conversation | null;
  client: ConversationClient;
  agent: ConversationAgent;
  property: ConversationProperty;
}

export interface FirstMessageResult {
  conversation: Conversation;
  message: Message;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  roles: string[];
  status: 'Active' | 'Suspended';
  createdAt: string;
  agentId: number | null;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  fullName: string;
  roles: string[];
  /** Batch 5: saved location, used by the "Properties Near You" section. */
  locationId?: number | null;
  locationName?: string | null;
  locationType?: string | null;
  hasCoordinates?: boolean;
}

export interface AuthResponse {
  userId: string;
  email: string;
  roles: string[];
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export type DashboardData = AdminDashboard | AgentDashboard | ClientDashboard;

export interface AdminDashboard {
  totalProperties: number;
  totalAgents: number;
  totalEnquiries: number;
  totalUsers: number;
  totalDevelopmentProjects: number;
  totalBlogPosts: number;
  recentProperties: Property[];
  recentEnquiries: Enquiry[];
}

export interface AgentDashboard {
  agent: Agent;
  totalProperties: number;
  recentProperties: Property[];
  totalEnquiries: number;
  pendingEnquiries: number;
  recentEnquiries: Enquiry[];
}

export interface ClientDashboard {
  profile: AuthUser;
  totalSavedProperties: number;
  savedProperties: Property[];
  totalEnquiries: number;
  pendingEnquiries: number;
  recentEnquiries: Enquiry[];
}

export interface PropertyFilters {
  query?: string;
  location?: string;
  locationId?: number;
  type?: string;
  status?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  sort?: string;
  agentId?: number;
  page?: number;
  pageSize?: number;
}

export interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  roles: string[];
  status: 'Active' | 'Suspended';
  createdAt: string;
  agentId: number | null;
  agentLicenseNumber: string | null;
  agentAgencyName: string | null;
  agentIsVerified: boolean | null;
}

export interface AgentSummary {
  id: number;
  fullName: string;
  email: string;
  agency: string;
  phone: string;
  licenseNumber: string | null;
  bio: string | null;
  photo: string | null;
  photoPublicId: string | null;
  verified: boolean;
  propertyCount: number;
  enquiryCount: number;
  conversationCount: number;
  averageRating: number | null;
  reviewCount: number;
  /** Admin-facing triage backlog for this agent. Not public-facing content. */
  openReportCount: number;
  isSuspended: boolean;
  suspendedAt: string | null;
  suspensionReason: string | null;
}

export interface Paginated<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiErrorBody {
  code?: string;
  message?: string;
  type?: string;
  title?: string;
  detail?: string;
  status?: number;
}

export interface AiChatMessage {
  role: 'user' | 'model';
  content: string;
  sentAt: string;
  properties: Property[] | null;
}

export interface AiChatSession {
  id: number;
  title: string | null;
  lastMessageAt: string;
  messages: AiChatMessage[];
}

export interface SendAiMessageResponse {
  session: AiChatSession;
  assistantMessage: AiChatMessage;
}

// ============================================================
// Batch 7: recorded property transactions
// ============================================================

/** Mirrors the backend `TransactionStatus`. A sale and a lease share the vocabulary. */
export type TransactionStatus = 'Pending' | 'Active' | 'Completed' | 'Terminated' | 'Cancelled';

export type TransactionKind = 'Sale' | 'Lease';

export interface Transaction {
  id: number;
  kind: TransactionKind;
  status: TransactionStatus;
  statusLabel: string;

  propertyId: number;
  propertyTitle: string;
  propertySlug: string;
  propertyCity: string;
  propertyState: string;
  currency: string;

  /** The enquiry that produced this deal, when it is known. Null for a direct sale. */
  enquiryId: number | null;
  enquiryDate: string | null;

  // Sale-only fields. Null on a lease, and vice versa below.
  salePrice: number | null;
  saleDate: string | null;
  buyerName: string | null;
  buyerContact: string | null;

  leaseStartDate: string | null;
  leaseEndDate: string | null;
  monthlyRent: number | null;
  tenantName: string | null;
  tenantContact: string | null;

  /** Registered account of the buyer/tenant, derived server-side from the enquiry. */
  counterpartyUserId: string | null;
  recordedByUserId: string;
  recordedByName: string;
  createdAt: string;
  notes: string | null;
}

/** Body for `POST /transactions/properties/{id}/sales`. Carries no user ids. */
export interface RecordSalePayload {
  salePrice: number;
  saleDate: string;
  buyerName: string;
  buyerContact: string;
  notes?: string | null;
  status?: TransactionStatus;
  enquiryId?: number | null;
}

/** Body for `POST /transactions/properties/{id}/leases`. Carries no user ids. */
export interface RecordLeasePayload {
  tenantName: string;
  tenantContact: string;
  monthlyRent: number;
  leaseStartDate: string;
  leaseEndDate: string;
  notes?: string | null;
  status?: TransactionStatus;
  enquiryId?: number | null;
}

export interface TransactionFilters {
  kind?: TransactionKind | '';
  status?: TransactionStatus | '';
  propertyId?: number;
  enquiryId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface TransactionTotals {
  saleCount: number;
  leaseCount: number;
  totalSaleValue: number;
  totalMonthlyRent: number;
  totalLeaseTermValue: number;
  activeLeaseCount: number;
  propertiesSold: number;
  propertiesRented: number;
  averageSalePrice: number;
}

export interface TransactionTrendPoint {
  month: string;
  label: string;
  count: number;
  value: number;
}

export interface BreakdownPoint {
  label: string;
  count: number;
  value: number;
  /** 0-100, computed server-side against the largest value in the set. */
  percentage: number;
}

export interface PropertyPerformance {
  propertyId: number;
  title: string;
  slug: string;
  city: string;
  currency: string;
  kind: TransactionKind;
  value: number;
  occurredAt: string | null;
}

export interface EnquiryToDealFunnel {
  enquiryCount: number;
  enquiriesLinkedToDeals: number;
  enquiriesStillOpen: number;
  /**
   * Null when there were no enquiries to divide by. Rendered as an explicit
   * "no data" state, never as 0%, because zero out of zero is not a measurement.
   */
  conversionRate: number | null;
}

export interface TransactionAnalytics {
  generatedAt: string;
  currency: string;
  totals: TransactionTotals;
  monthlySales: TransactionTrendPoint[];
  monthlyDeals: TransactionTrendPoint[];
  byStatus: BreakdownPoint[];
  byCity: BreakdownPoint[];
  topProperties: PropertyPerformance[];
  enquiryToDealFunnel: EnquiryToDealFunnel;
  /** Distinguishes "no deals ever" from "no deals in this window". */
  hasAnyTransactions: boolean;
}