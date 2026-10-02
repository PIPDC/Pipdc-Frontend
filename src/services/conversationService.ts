import { api } from './api';
import { enquiryService } from './enquiryService';
import type { Conversation, Enquiry, EnquiryConversationState, Paginated } from '../types';

const DEFAULT_PROPERTY_ENQUIRY_MESSAGE = "I'm interested in this property. (via PIPDC Messages)";

const getStateByEnquiry = async (enquiryId: number): Promise<EnquiryConversationState> => {
  const { data } = await api.get<EnquiryConversationState>(`/enquiries/${enquiryId}/conversation`);
  return data;
};

// Resolves (or creates, for a first-time lead) the client's Enquiry for a property.
// This never creates a Conversation: conversations only exist after the first message.
const resolveEnquiryForProperty = async (propertyId: number, idempotencyKey?: string): Promise<Enquiry> => {
  const existing = await enquiryService.mineByProperty(propertyId);
  if (existing) return existing;
  return enquiryService.create({ message: DEFAULT_PROPERTY_ENQUIRY_MESSAGE, propertyId }, idempotencyKey);
};

// Resolves the conversation linked to an enquiry. Does NOT create an enquiry:
// a conversation only exists once a client has actually messaged about a
// property, and the enquiry behind it was created deliberately by the enquiry
// flow. Used when deep-linking into /dashboard/messages?enquiry=...
const getConversationForEnquiry = async (enquiryId: number): Promise<number | null> => {
  const state = await getStateByEnquiry(enquiryId);
  return state.conversation?.id ?? null;
};

export const conversationService = {
  async list(params?: Record<string, unknown>): Promise<Paginated<Conversation>> {
    const { data } = await api.get<Paginated<Conversation>>('/conversations', { params });
    return data;
  },
  async getById(id: number): Promise<Conversation> {
    const { data } = await api.get<Conversation>(`/conversations/${id}`);
    return data;
  },
  getStateByEnquiry,
  resolveEnquiryForProperty,
  getConversationForEnquiry,

  // ------------------------------------------------------------
  // Batch 6: handing a conversation to PIPDC
  // ------------------------------------------------------------
  // Escalation is a change of ownership on the same thread, not a new conversation,
  // so these live beside the existing conversation calls and never move history.

  /** Admin-only queue of escalated, claimed, and resolved conversations. */
  async listEscalations(params?: Record<string, unknown>): Promise<Paginated<Conversation>> {
    const { data } = await api.get<Paginated<Conversation>>('/conversations/escalations', { params });
    return data;
  },

  /**
   * The handling agent hands the conversation to PIPDC. The reason is required
   * server-side, because it is what an administrator reads to decide whether to
   * claim the case.
   */
  async escalate(conversationId: number, reason: string): Promise<Conversation> {
    const { data } = await api.post<Conversation>(`/conversations/${conversationId}/escalate`, { reason });
    return data;
  },

  /** An administrator takes ownership. Only the claimant may reply afterwards. */
  async claim(conversationId: number): Promise<Conversation> {
    const { data } = await api.post<Conversation>(`/conversations/${conversationId}/claim`);
    return data;
  },

  /** The owning administrator closes the case. The thread and its history remain. */
  async resolve(conversationId: number): Promise<Conversation> {
    const { data } = await api.post<Conversation>(`/conversations/${conversationId}/resolve`);
    return data;
  },
};
