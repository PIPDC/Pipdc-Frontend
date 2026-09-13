import { useMutation, useQueryClient } from '@tanstack/react-query';
import { agentService } from '../services/agentService';
import { authService } from '../services/authService';
import { blogService } from '../services/blogService';
import { enquiryService } from '../services/enquiryService';
import { locationService } from '../services/locationService';
import { messageService } from '../services/messageService';
import { propertyService } from '../services/propertyService';
import { developmentService } from '../services/developmentService';
import { userService } from '../services/userService';
import { isConcurrencyConflict } from '../services/api';
import { queryKeys } from './queries';

function useInvalidate(prefixes: string[][]) {
  const queryClient = useQueryClient();
  return () => {
    prefixes.forEach((prefix) => {
      void queryClient.invalidateQueries({ queryKey: prefix });
    });
  };
}

function useRefetchOnConflict(prefixes: string[][]) {
  const queryClient = useQueryClient();
  return (error: unknown) => {
    if (isConcurrencyConflict(error)) {
      prefixes.forEach((prefix) => {
        void queryClient.invalidateQueries({ queryKey: prefix });
      });
    }
  };
}

export function useCreateProperty() {
  const invalidate = useInvalidate([['properties'], ['agents'], ['dashboard']]);
  return useMutation({ mutationFn: (payload: Record<string, unknown>) => propertyService.create(payload), onSuccess: invalidate });
}

export function useUpdateProperty() {
  const invalidate = useInvalidate([['properties'], ['agents'], ['dashboard']]);
  const refetchOnConflict = useRefetchOnConflict([['properties'], ['agents'], ['dashboard']]);
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => propertyService.update(id, payload),
    onSuccess: invalidate,
    onError: refetchOnConflict,
  });
}

export function useSetFeatured() {
  const invalidate = useInvalidate([['properties'], ['dashboard']]);
  const refetchOnConflict = useRefetchOnConflict([['properties'], ['dashboard']]);
  return useMutation({
    mutationFn: ({ id, featured }: { id: number; featured: boolean }) => propertyService.setFeatured(id, featured),
    onSuccess: invalidate,
    onError: refetchOnConflict,
  });
}

export function useDeleteProperty() {
  const invalidate = useInvalidate([['properties'], ['agents'], ['dashboard'], ['saved-properties']]);
  return useMutation({ mutationFn: (id: number) => propertyService.remove(id), onSuccess: invalidate });
}

export function useChangePropertyStatus() {
  const invalidate = useInvalidate([['properties'], ['dashboard']]);
  const refetchOnConflict = useRefetchOnConflict([['properties'], ['dashboard']]);
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => propertyService.changeStatus(id, status),
    onSuccess: invalidate,
    onError: refetchOnConflict,
  });
}

export function useChangePropertyListingType() {
  const invalidate = useInvalidate([['properties'], ['dashboard']]);
  const refetchOnConflict = useRefetchOnConflict([['properties'], ['dashboard']]);
  return useMutation({
    mutationFn: ({ id, listingType }: { id: number; listingType: string }) => propertyService.changeListingType(id, listingType),
    onSuccess: invalidate,
    onError: refetchOnConflict,
  });
}

export function useAssignPropertyAgent() {
  const invalidate = useInvalidate([['properties'], ['agents'], ['dashboard']]);
  const refetchOnConflict = useRefetchOnConflict([['properties'], ['agents'], ['dashboard']]);
  return useMutation({
    mutationFn: ({ id, agentId }: { id: number; agentId: number | null }) => propertyService.assignAgent(id, agentId),
    onSuccess: invalidate,
    onError: refetchOnConflict,
  });
}

export function useCreateAgent() {
  const invalidate = useInvalidate([['agents'], ['users'], ['dashboard']]);
  return useMutation({ mutationFn: (payload: Record<string, unknown>) => agentService.create(payload), onSuccess: invalidate });
}

export function useUpdateAgent() {
  const invalidate = useInvalidate([['agents'], ['users'], ['dashboard']]);
  const refetchOnConflict = useRefetchOnConflict([['agents'], ['users'], ['dashboard']]);
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => agentService.update(id, payload),
    onSuccess: invalidate,
    onError: refetchOnConflict,
  });
}

export function useDeleteAgent() {
  const invalidate = useInvalidate([['agents'], ['users'], ['dashboard']]);
  return useMutation({ mutationFn: (id: number) => agentService.remove(id), onSuccess: invalidate });
}

export function useUpdateEnquiry() {
  const invalidate = useInvalidate([['enquiries'], ['dashboard']]);
  const refetchOnConflict = useRefetchOnConflict([['enquiries'], ['dashboard']]);
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { fullName: string; email: string; phone?: string | null; message: string; status: string } }) =>
      enquiryService.update(id, payload),
    onSuccess: invalidate,
    onError: refetchOnConflict,
  });
}

export function useDeleteEnquiry() {
  const invalidate = useInvalidate([['enquiries'], ['dashboard']]);
  return useMutation({ mutationFn: (id: number) => enquiryService.remove(id), onSuccess: invalidate });
}

export function useNotifyAgent() {
  const invalidate = useInvalidate([['enquiries'], ['dashboard']]);
  return useMutation({ mutationFn: (id: number) => enquiryService.notifyAgent(id), onSuccess: invalidate });
}

export function useCreateBlogPost() {
  const invalidate = useInvalidate([['blog']]);
  return useMutation({ mutationFn: (payload: Record<string, unknown>) => blogService.create(payload), onSuccess: invalidate });
}

export function useUpdateBlogPost() {
  const invalidate = useInvalidate([['blog']]);
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => blogService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteBlogPost() {
  const invalidate = useInvalidate([['blog']]);
  return useMutation({ mutationFn: (id: number) => blogService.remove(id), onSuccess: invalidate });
}

export function usePublishBlogPost() {
  const invalidate = useInvalidate([['blog']]);
  return useMutation({ mutationFn: (id: number) => blogService.publish(id), onSuccess: invalidate });
}

export function useUnpublishBlogPost() {
  const invalidate = useInvalidate([['blog']]);
  return useMutation({ mutationFn: (id: number) => blogService.unpublish(id), onSuccess: invalidate });
}

export function useCreateCategory() {
  const invalidate = useInvalidate([['blog'], ['blog', 'categories']]);
  return useMutation({
    mutationFn: (payload: { name: string; slug?: string }) => blogService.createCategory(payload),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidate([['blog'], ['blog', 'categories']]);
  return useMutation({ mutationFn: (id: number) => blogService.removeCategory(id), onSuccess: invalidate });
}

export function useCreateTag() {
  const invalidate = useInvalidate([['blog'], ['blog', 'tags']]);
  return useMutation({
    mutationFn: (payload: { name: string; slug?: string }) => blogService.createTag(payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTag() {
  const invalidate = useInvalidate([['blog'], ['blog', 'tags']]);
  return useMutation({ mutationFn: (id: number) => blogService.removeTag(id), onSuccess: invalidate });
}

export function useAddRole() {
  const invalidate = useInvalidate([['users'], ['agents'], ['dashboard']]);
  return useMutation({
    mutationFn: (payload: { email: string; role: string }) => authService.addRole(payload),
    onSuccess: invalidate,
  });
}

export function useRemoveRole() {
  const invalidate = useInvalidate([['users'], ['agents'], ['dashboard']]);
  return useMutation({
    mutationFn: (payload: { email: string; role: string }) => authService.removeRole(payload),
    onSuccess: invalidate,
  });
}

export function useDeactivateUser() {
  const invalidate = useInvalidate([['users'], ['dashboard']]);
  return useMutation({
    mutationFn: (id: string) => userService.deactivate(id),
    onSuccess: invalidate,
  });
}

export function useActivateUser() {
  const invalidate = useInvalidate([['users'], ['dashboard']]);
  return useMutation({
    mutationFn: (id: string) => userService.activate(id),
    onSuccess: invalidate,
  });
}

export function useToggleAgentVerification() {
  const invalidate = useInvalidate([['agents'], ['users'], ['dashboard']]);
  const refetchOnConflict = useRefetchOnConflict([['agents'], ['users'], ['dashboard']]);
  return useMutation({
    mutationFn: (id: number) => agentService.toggleVerification(id),
    onSuccess: invalidate,
    onError: refetchOnConflict,
  });
}

export function useUpdateProfile() {
  const invalidate = useInvalidate([['dashboard']]);
  return useMutation({
    mutationFn: (payload: { firstName: string; lastName: string; phoneNumber?: string | null }) => authService.updateProfile(payload),
    onSuccess: invalidate,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) => authService.changePassword(payload),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (payload: { email: string; code: string }) => authService.verifyEmail(payload),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: ({ email, idempotencyKey }: { email: string; idempotencyKey: string }) => authService.resendVerification(email, idempotencyKey),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: { email: string; code: string; newPassword: string }) =>
      authService.resetPassword(payload),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content, idempotencyKey }: { conversationId: number; content: string; idempotencyKey: string }) => messageService.send(conversationId, content, idempotencyKey),
    onSuccess: (_data, { conversationId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
    },
  });
}

export function useSendFirstMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ enquiryId, content, idempotencyKey }: { enquiryId: number; content: string; idempotencyKey: string }) => messageService.sendByEnquiry(enquiryId, content, idempotencyKey),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversation(data.conversation.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversationByEnquiry(data.conversation.enquiryId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(data.conversation.id) });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) => messageService.markRead(conversationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

// ── Development Projects ─────────────────────────────────────────────────

export function useCreateDevelopmentProject() {
  const invalidate = useInvalidate([['development-projects'], ['dashboard']]);
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => developmentService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateDevelopmentProject() {
  const invalidate = useInvalidate([['development-projects'], ['dashboard']]);
  const refetchOnConflict = useRefetchOnConflict([['development-projects'], ['dashboard']]);
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => developmentService.update(id, payload),
    onSuccess: invalidate,
    onError: refetchOnConflict,
  });
}

export function useSetDevelopmentFeatured() {
  const invalidate = useInvalidate([['development-projects'], ['dashboard']]);
  const refetchOnConflict = useRefetchOnConflict([['development-projects'], ['dashboard']]);
  return useMutation({
    mutationFn: ({ id, featured }: { id: number; featured: boolean }) => developmentService.setFeatured(id, featured),
    onSuccess: invalidate,
    onError: refetchOnConflict,
  });
}

export function useDeleteDevelopmentProject() {
  const invalidate = useInvalidate([['development-projects'], ['dashboard']]);
  return useMutation({
    mutationFn: (id: number) => developmentService.remove(id),
    onSuccess: invalidate,
  });
}

// ── Development Units ────────────────────────────────────────────────────

export function useCreateDevelopmentUnit() {
  const invalidate = useInvalidate([['development-projects'], ['development-tracking']]);
  return useMutation({
    mutationFn: ({ projectId, payload }: { projectId: number; payload: Record<string, unknown> }) => developmentService.createUnit(projectId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateDevelopmentUnit() {
  const invalidate = useInvalidate([['development-projects'], ['development-tracking']]);
  return useMutation({
    mutationFn: ({ projectId, unitId, payload }: { projectId: number; unitId: number; payload: Record<string, unknown> }) =>
      developmentService.updateUnit(projectId, unitId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteDevelopmentUnit() {
  const invalidate = useInvalidate([['development-projects'], ['development-tracking']]);
  return useMutation({
    mutationFn: ({ projectId, unitId }: { projectId: number; unitId: number }) => developmentService.deleteUnit(projectId, unitId),
    onSuccess: invalidate,
  });
}

// ── Development Updates ──────────────────────────────────────────────────

export function useCreateDevelopmentUpdate() {
  const invalidate = useInvalidate([['development-projects'], ['development-tracking']]);
  return useMutation({
    mutationFn: ({ projectId, payload }: { projectId: number; payload: Record<string, unknown> }) => developmentService.createUpdate(projectId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateDevelopmentUpdate() {
  const invalidate = useInvalidate([['development-projects'], ['development-tracking']]);
  return useMutation({
    mutationFn: ({ projectId, updateId, payload }: { projectId: number; updateId: number; payload: Record<string, unknown> }) =>
      developmentService.updateUpdate(projectId, updateId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteDevelopmentUpdate() {
  const invalidate = useInvalidate([['development-projects'], ['development-tracking']]);
  return useMutation({
    mutationFn: ({ projectId, updateId }: { projectId: number; updateId: number }) => developmentService.deleteUpdate(projectId, updateId),
    onSuccess: invalidate,
  });
}

// ── Development Tracking ─────────────────────────────────────────────────

export function useTrackDevelopmentProject() {
  const invalidate = useInvalidate([['development-tracking'], ['development-projects'], ['dashboard']]);
  return useMutation({
    mutationFn: ({ projectId, unitId }: { projectId: number; unitId?: number }) => developmentService.track(projectId, unitId),
    onSuccess: invalidate,
  });
}

export function useStopDevelopmentTracking() {
  const invalidate = useInvalidate([['development-tracking'], ['development-projects'], ['dashboard']]);
  return useMutation({
    mutationFn: (projectId: number) => developmentService.stopTracking(projectId),
    onSuccess: invalidate,
  });
}

export function useUpdateTrackingStatus() {
  const invalidate = useInvalidate([['admin-development-tracking'], ['development-tracking']]);
  return useMutation({
    mutationFn: ({ trackingId, status }: { trackingId: number; status: string }) => developmentService.adminUpdateTrackingStatus(trackingId, status),
    onSuccess: invalidate,
  });
}

// ── Locations ──────────────────────────────────────────────────────────

export function useCreateLocation() {
  const invalidate = useInvalidate([['locations'], ['properties'], ['development-projects']]);
  return useMutation({
    mutationFn: (payload: { name: string; type: string; parentId?: number | null }) => locationService.create(payload),
    onSuccess: invalidate,
  });
}

export function useDeleteLocation() {
  const invalidate = useInvalidate([['locations'], ['properties'], ['development-projects']]);
  return useMutation({ mutationFn: (id: number) => locationService.remove(id), onSuccess: invalidate });
}
