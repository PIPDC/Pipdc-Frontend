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
}

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
