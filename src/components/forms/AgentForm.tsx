import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { ImageUpload } from '../ui/ImageUpload';
import { useCreateAgent, useUpdateAgent } from '../../hooks/mutations';
import { useToast } from '../ui/Toast';
import { extractApiError, isConcurrencyConflict, CONCURRENCY_CONFLICT_DESCRIPTION } from '../../services/api';
import type { Agent } from '../../types';
import type { UploadResult } from '../../services/imageService';

const schema = z.object({
  title: z.string().optional(),
  bio: z.string().optional(),
  agencyName: z.string().min(2, 'Agency name is required'),
  licenseNumber: z.string().optional(),
  phoneNumber: z.string().min(6, 'Phone number is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  verified: z.boolean(),
});

type AgentFormValues = z.infer<typeof schema>;

interface AgentFormProps {
  open: boolean;
  agent: Agent | null;
  onClose: () => void;
}

export function AgentForm({ open, agent, onClose }: AgentFormProps) {
  const { notify } = useToast();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const isEditing = Boolean(agent);
  const [photo, setPhoto] = useState<UploadResult[]>([]);

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<AgentFormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!open) {
      setPhoto(null);
      return;
    }
    if (agent) {
      reset({
        title: agent.title ?? '',
        bio: agent.bio ?? '',
        agencyName: agent.agency,
        licenseNumber: agent.licenseNumber ?? '',
        phoneNumber: agent.phone,
        email: '',
        password: '',
        firstName: agent.firstName,
        lastName: agent.lastName,
        verified: agent.verified,
      });
      if (agent.photo) {
        setPhoto([{ url: agent.photo, publicId: agent.photoPublicId ?? '' }]);
      } else {
        setPhoto([]);
      }
    } else {
      reset({
        title: 'Agent',
        bio: '',
        agencyName: '',
        licenseNumber: '',
        phoneNumber: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        verified: false,
      });
      setPhoto([]);
    }
  }, [open, agent, reset]);

  const onSubmit = async (data: AgentFormValues) => {
    if (!isEditing) {
      if (!data.email) {
        setError('email', { message: 'Email is required for a new agent.' });
        return;
      }
      if (!data.password) {
        setError('password', { message: 'Password is required for a new agent.' });
        return;
      }
    }

    const payload: Record<string, unknown> = {
      title: data.title?.trim() || undefined,
      photoUrl: photo[0]?.url || undefined,
      photoPublicId: photo[0]?.publicId || undefined,
      bio: data.bio?.trim() || undefined,
      agencyName: data.agencyName,
      licenseNumber: data.licenseNumber?.trim() || undefined,
      phoneNumber: data.phoneNumber,
    };

    try {
      if (isEditing && agent) {
        payload.verified = data.verified;
        await updateAgent.mutateAsync({ id: agent.id, payload });
        notify({ type: 'success', title: 'Agent updated', description: `${agent.fullName}'s profile was updated.` });
      } else {
        const createPayload = {
          ...payload,
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        };
        await createAgent.mutateAsync(createPayload);
        notify({ type: 'success', title: 'Agent created', description: `${data.firstName} ${data.lastName} was added as an agent.` });
      }
      onClose();
    } catch (err) {
      notify({
        type: 'error',
        title: isConcurrencyConflict(err) ? 'This agent just changed' : 'Could not save agent',
        description: isConcurrencyConflict(err) ? CONCURRENCY_CONFLICT_DESCRIPTION : extractApiError(err),
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Agent' : 'Add Agent'}
      description={isEditing ? 'Update the agent profile below.' : 'Create an agent account for PIPDC.'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {!isEditing && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" placeholder="e.g. Amina" error={errors.firstName?.message} {...register('firstName')} />
              <Input label="Last name" placeholder="e.g. Yusuf" error={errors.lastName?.message} {...register('lastName')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Email" type="email" placeholder="agent@pipdc.gov.ng" error={errors.email?.message} {...register('email')} />
              <Input label="Temporary password" type="password" placeholder="Min 8 characters" error={errors.password?.message} {...register('password')} />
            </div>
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Title" placeholder="e.g. Senior Agent" error={errors.title?.message} {...register('title')} />
          <Input label="Agency name" placeholder="e.g. PIPDC Realty" error={errors.agencyName?.message} {...register('agencyName')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Phone number" placeholder="e.g. +234 800 000 0000" error={errors.phoneNumber?.message} {...register('phoneNumber')} />
          <Input label="License number" placeholder="e.g. RNPL-0042" error={errors.licenseNumber?.message} {...register('licenseNumber')} />
        </div>

        <div className="grid items-start gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Profile Photo</label>
            <ImageUpload folder="agents" value={photo} onChange={setPhoto} maxFiles={1} />
          </div>
          <Textarea label="Bio" placeholder="Short professional summary." className="min-h-[100px]" error={errors.bio?.message} {...register('bio')} />
        </div>

        {isEditing && (
          <label className="inline-flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-forest-500 focus:ring-forest-500" {...register('verified')} />
            Verified agent
          </label>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>{isEditing ? 'Save changes' : 'Create agent'}</Button>
        </div>
      </form>
    </Modal>
  );
}
