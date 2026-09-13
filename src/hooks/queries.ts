import { useQuery } from '@tanstack/react-query';
import { agentService, type AgentFilters } from '../services/agentService';
import { blogService, type BlogFilters } from '../services/blogService';
import { conversationService } from '../services/conversationService';
import { dashboardService } from '../services/dashboardService';
import { enquiryService, type EnquiryFilters } from '../services/enquiryService';
import { locationService, type LocationListParams } from '../services/locationService';
import { messageService } from '../services/messageService';
import { propertyService } from '../services/propertyService';
import { savedPropertyService, type SavedPropertyFilters } from '../services/savedPropertyService';
import { userService, type UserFilters } from '../services/userService';
import { developmentService } from '../services/developmentService';
import { aiChatService } from '../services/aiChatService';
import { useAuth } from '../contexts/AuthContext';
import { primaryRole } from '../utils/roles';
import type { PropertyFilters } from '../types';
import type { DevelopmentProjectFilters, DevelopmentTrackingFilters } from '../types/development';

export const queryKeys = {
  propertyList: (filters: PropertyFilters) => ['properties', filters] as const,
  featuredProperties: ['properties', 'featured'] as const,
  property: (slug: string) => ['properties', 'slug', slug] as const,
  similarProperties: (id: number) => ['properties', id, 'similar'] as const,
  agentProperties: (agentId: number) => ['properties', 'agent', agentId] as const,
  agents: (filters?: AgentFilters) => ['agents', filters] as const,
  agent: (id: number) => ['agents', id] as const,
  myAgent: ['agents', 'me'] as const,
  enquiries: (filters?: EnquiryFilters) => ['enquiries', filters] as const,
  myEnquiries: (filters?: EnquiryFilters) => ['enquiries', 'mine', filters] as const,
  agentEnquirySummaries: (filters?: EnquiryFilters) => ['enquiries', 'agents', 'summary', filters] as const,
  agentEnquiries: (agentId: number, filters?: EnquiryFilters) => ['enquiries', 'agents', agentId, filters] as const,
  propertyEnquiries: (propertyId: number) => ['enquiries', 'property', propertyId] as const,
  blogPosts: (filters?: BlogFilters) => ['blog', filters] as const,
  blogPostsAll: (filters?: BlogFilters) => ['blog', 'all', filters] as const,
  blogPost: (slug: string) => ['blog', 'slug', slug] as const,
  blogRelated: (slug: string) => ['blog', 'related', slug] as const,
  blogCategories: ['blog', 'categories'] as const,
  blogTags: ['blog', 'tags'] as const,
  users: (filters?: UserFilters) => ['users', filters] as const,
  user: (id: string) => ['users', id] as const,
  agentSummary: (id: number) => ['agents', id, 'summary'] as const,
  savedIds: ['saved-properties', 'ids'] as const,
  savedProperties: (filters?: SavedPropertyFilters) => ['saved-properties', filters] as const,
  dashboard: (role: string) => ['dashboard', role] as const,
  conversations: ['conversations'] as const,
  conversation: (id: number) => ['conversations', id] as const,
  conversationByEnquiry: (enquiryId: number) => ['conversations', 'enquiry', enquiryId] as const,
  messages: (conversationId: number) => ['conversations', conversationId, 'messages'] as const,
  developmentProjects: (filters?: DevelopmentProjectFilters) => ['development-projects', filters] as const,
  featuredDevelopmentProjects: ['development-projects', 'featured'] as const,
  developmentProject: (slug: string) => ['development-projects', 'slug', slug] as const,
  developmentProjectById: (id: number) => ['development-projects', id] as const,
  developmentUnits: (projectId: number) => ['development-projects', projectId, 'units'] as const,
  developmentUpdates: (projectId: number) => ['development-projects', projectId, 'updates'] as const,
  developmentTracking: (filters?: DevelopmentProjectFilters) => ['development-tracking', filters] as const,
  adminDevelopmentTracking: (filters?: DevelopmentTrackingFilters) => ['admin-development-tracking', filters] as const,
  locations: (params?: LocationListParams) => ['locations', params] as const,
  locationHierarchy: ['locations', 'hierarchy'] as const,
  aiSession: ['ai-chat', 'session'] as const,
};

export function useFeaturedProperties() {
  return useQuery({ queryKey: queryKeys.featuredProperties, queryFn: propertyService.featured });
}

export function useProperties(filters: PropertyFilters) {
  return useQuery({
    queryKey: queryKeys.propertyList(filters),
    queryFn: () => propertyService.list(filters),
  });
}

export function useProperty(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.property(slug ?? ''),
    queryFn: () => propertyService.getBySlug(slug!),
    enabled: Boolean(slug),
  });
}

export function useSimilarProperties(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.similarProperties(id ?? 0),
    queryFn: () => propertyService.similar(id!),
    enabled: Boolean(id),
  });
}

export function useAgents(filters?: AgentFilters) {
  return useQuery({
    queryKey: queryKeys.agents(filters),
    queryFn: () => agentService.list(filters),
  });
}

export function useAgent(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.agent(id ?? 0),
    queryFn: () => agentService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useMyAgent(enabled = true) {
  return useQuery({
    queryKey: queryKeys.myAgent,
    queryFn: agentService.me,
    enabled,
  });
}

export function useAgentProperties(agentId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.agentProperties(agentId ?? 0),
    queryFn: () => propertyService.list({ agentId, pageSize: 100 }),
    enabled: Boolean(agentId),
  });
}

export function useEnquiries(filters?: EnquiryFilters) {
  return useQuery({
    queryKey: queryKeys.enquiries(filters),
    queryFn: () => enquiryService.list(filters),
  });
}

export function useMyEnquiries(filters?: EnquiryFilters) {
  return useQuery({
    queryKey: queryKeys.myEnquiries(filters),
    queryFn: () => enquiryService.mine(filters),
  });
}

export function useAgentEnquirySummaries(filters?: EnquiryFilters) {
  return useQuery({
    queryKey: queryKeys.agentEnquirySummaries(filters),
    queryFn: () => enquiryService.agentSummaries(filters),
  });
}

export function useAgentEnquiries(agentId: number | undefined, filters?: EnquiryFilters) {
  return useQuery({
    queryKey: queryKeys.agentEnquiries(agentId ?? 0, filters),
    queryFn: () => enquiryService.byAgent(agentId!, filters),
    enabled: Boolean(agentId),
  });
}

export function usePropertyEnquiries(propertyId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.propertyEnquiries(propertyId ?? 0),
    queryFn: () => enquiryService.byProperty(propertyId!, { pageSize: 100 }),
    enabled: Boolean(propertyId),
  });
}

export function useBlogPosts(filters?: BlogFilters) {
  return useQuery({
    queryKey: queryKeys.blogPosts(filters),
    queryFn: () => blogService.list(filters),
  });
}

export function useAllBlogPosts(filters?: BlogFilters) {
  return useQuery({
    queryKey: queryKeys.blogPostsAll(filters),
    queryFn: () => blogService.listManaged(filters),
  });
}

export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.blogPost(slug ?? ''),
    queryFn: () => blogService.getBySlug(slug!),
    enabled: Boolean(slug),
  });
}

export function useRelatedPosts(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.blogRelated(slug ?? ''),
    queryFn: () => blogService.getRelated(slug!),
    enabled: Boolean(slug),
  });
}

export function useBlogCategories() {
  return useQuery({
    queryKey: queryKeys.blogCategories,
    queryFn: blogService.categories,
  });
}

export function useBlogTags() {
  return useQuery({
    queryKey: queryKeys.blogTags,
    queryFn: blogService.tags,
  });
}

export function useSavedProperties(filters?: SavedPropertyFilters) {
  return useQuery({
    queryKey: queryKeys.savedProperties(filters),
    queryFn: () => savedPropertyService.list(filters),
  });
}

export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: queryKeys.users(filters),
    queryFn: () => userService.list(filters),
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.user(id ?? ''),
    queryFn: () => userService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useAgentSummary(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.agentSummary(id ?? 0),
    queryFn: () => agentService.getSummary(id!),
    enabled: Boolean(id),
  });
}

export function useDashboard() {
  const { user } = useAuth();
  const role = primaryRole(user?.roles);
  return useQuery({
    queryKey: queryKeys.dashboard(role),
    queryFn: dashboardService.get,
    enabled: Boolean(user),
  });
}

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: () => conversationService.list({ pageSize: 100 }),
  });
}

export function useConversation(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.conversation(id ?? 0),
    queryFn: () => conversationService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useEnquiryConversationState(enquiryId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.conversationByEnquiry(enquiryId ?? 0),
    queryFn: () => conversationService.getStateByEnquiry(enquiryId!),
    enabled: Boolean(enquiryId),
  });
}

export function useMessages(conversationId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.messages(conversationId ?? 0),
    queryFn: () => messageService.list(conversationId!),
    enabled: Boolean(conversationId),
  });
}

// ── Development Projects ─────────────────────────────────────────────────

export function useDevelopmentProjects(filters?: DevelopmentProjectFilters) {
  return useQuery({
    queryKey: queryKeys.developmentProjects(filters),
    queryFn: () => developmentService.browse(filters),
  });
}

export function useDevelopmentProject(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.developmentProject(slug ?? ''),
    queryFn: () => developmentService.getPublicBySlug(slug!),
    enabled: Boolean(slug),
  });
}

export function useFeaturedDevelopmentProjects() {
  return useQuery({
    queryKey: queryKeys.featuredDevelopmentProjects,
    queryFn: () => developmentService.browse({ featured: true, pageSize: 6 }),
  });
}

export function useAdminDevelopmentProjects(filters?: DevelopmentProjectFilters) {
  return useQuery({
    queryKey: queryKeys.developmentProjects(filters),
    queryFn: () => developmentService.list(filters),
  });
}

export function useAdminDevelopmentProject(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.developmentProjectById(id ?? 0),
    queryFn: () => developmentService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useDevelopmentUnits(projectId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.developmentUnits(projectId ?? 0),
    queryFn: () => developmentService.listUnits(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useDevelopmentUpdates(projectId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.developmentUpdates(projectId ?? 0),
    queryFn: () => developmentService.listUpdates(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useDevelopmentTracking(filters?: DevelopmentProjectFilters) {
  return useQuery({
    queryKey: queryKeys.developmentTracking(filters),
    queryFn: () => developmentService.getTracked(filters),
  });
}

export function useAdminDevelopmentTracking(filters?: DevelopmentTrackingFilters) {
  return useQuery({
    queryKey: queryKeys.adminDevelopmentTracking(filters),
    queryFn: () => developmentService.adminListTracking(filters),
  });
}

// ── Locations ──────────────────────────────────────────────────────────

export function useLocations(params?: LocationListParams) {
  return useQuery({
    queryKey: queryKeys.locations(params),
    queryFn: () => locationService.list(params),
  });
}

export function useLocationHierarchy() {
  return useQuery({
    queryKey: queryKeys.locationHierarchy,
    queryFn: locationService.getHierarchy,
  });
}

export function useAiSession() {
  return useQuery({
    queryKey: queryKeys.aiSession,
    queryFn: aiChatService.getSession,
    retry: false,
  });
}
