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
};
