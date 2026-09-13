import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Input';
import { ImageUpload } from '../ui/ImageUpload';
import { useCreateDevelopmentProject, useUpdateDevelopmentProject, useCreateLocation } from '../../hooks/mutations';
import { useLocations } from '../../hooks/queries';
import { useToast } from '../ui/Toast';
import { extractApiError, isConcurrencyConflict, CONCURRENCY_CONFLICT_DESCRIPTION } from '../../services/api';
import { DEVELOPMENT_PROJECT_STATUS_OPTIONS, developmentStatusLabel } from '../../utils/developmentStatus';
import type { DevelopmentProject } from '../../types/development';
import type { UploadResult } from '../../services/imageService';

const toOptionalNumber = (value: unknown) => (value === '' || value === null || value === undefined ? undefined : Number(value));

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  slug: z.string().optional(),
  location: z.string().min(3, 'Location is required'),
  locationRefId: z.number().optional(),
  developer: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  expectedCompletionDate: z.string().optional(),
  progressPercentage: z.number({ message: 'Enter a valid number' }).min(0).max(100).optional(),
  featured: z.boolean(),
});

type DevelopmentProjectFormValues = z.infer<typeof schema>;

interface DevelopmentProjectFormProps {
  open: boolean;
  project: DevelopmentProject | null;
  onClose: () => void;
}

export function DevelopmentProjectForm({ open, project, onClose }: DevelopmentProjectFormProps) {
  const { notify } = useToast();
  const createProject = useCreateDevelopmentProject();
  const updateProject = useUpdateDevelopmentProject();
  const isEditing = Boolean(project);
  const [images, setImages] = useState<UploadResult[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [showCityModal, setShowCityModal] = useState(false);
  const [newCityName, setNewCityName] = useState('');

  const { data: states = [] } = useLocations({ type: 'State' });
  const { data: cities = [] } = useLocations(selectedStateId ? { parentId: selectedStateId } : undefined);
  const cityLocations = cities.filter(l => l.type === 'City' || l.type === 'LGA');
  const createLocation = useCreateLocation();

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<DevelopmentProjectFormValues>({
    resolver: zodResolver(schema),
  });

  const handleStateLocationChange = (id: number | null) => {
    setSelectedStateId(id);
    setSelectedCityId(null);
    setValue('locationRefId', id ?? undefined, { shouldDirty: true });
    setValue('location', '', { shouldDirty: true });
    if (id) {
      const state = states.find(s => s.id === id);
      if (state) setValue('location', state.name, { shouldDirty: true });
    }
  };

  const handleCityChange = (cityId: number | null) => {
    setSelectedCityId(cityId);
    if (cityId) {
      const city = cityLocations.find(c => c.id === cityId);
      if (city) {
        setValue('location', city.name, { shouldDirty: true });
        setValue('locationRefId', cityId, { shouldDirty: true });
      }
    } else if (selectedStateId) {
      setValue('locationRefId', selectedStateId, { shouldDirty: true });
    }
  };

  const handleCreateCity = async () => {
    const name = newCityName.trim();
    if (!name || !selectedStateId) return;
    try {
      const result = await createLocation.mutateAsync({ name, type: 'City', parentId: selectedStateId });
      if (result?.id) {
        setSelectedCityId(result.id);
        setValue('location', result.name, { shouldDirty: true });
        setValue('locationRefId', result.id, { shouldDirty: true });
      }
      setNewCityName('');
      setShowCityModal(false);
      notify({ type: 'success', title: 'City added', description: `"${name}" was created.` });
    } catch (err) {
      notify({ type: 'error', title: 'Could not add city', description: extractApiError(err) });
    }
  };

  useEffect(() => {
    if (!open) {
      setImages([]);
      setSelectedStateId(null);
      setSelectedCityId(null);
      setShowCityModal(false);
      setNewCityName('');
      return;
    }
    if (project) {
      reset({
        name: project.name,
        description: project.description,
        slug: project.slug ?? '',
        location: project.location,
        locationRefId: project.locationRefId ?? undefined,
        developer: project.developer ?? '',
        status: project.status,
        expectedCompletionDate: project.expectedCompletionDate
          ? project.expectedCompletionDate.split('T')[0]
          : '',
        progressPercentage: project.progressPercentage,
        featured: project.featured,
      });
      setImages((project.images ?? []).map((img) => ({ url: img.url, publicId: img.publicId })));
    } else {
      reset({
        name: '',
        description: '',
        slug: '',
        location: '',
        locationRefId: undefined,
        developer: '',
        status: 'Planned',
        expectedCompletionDate: '',
        progressPercentage: 0,
        featured: false,
      });
      setImages([]);
      setSelectedStateId(null);
      setSelectedCityId(null);
    }
  }, [open, project, reset]);

  useEffect(() => {
    if (!open || !project?.locationRefId || states.length === 0) return;
    const state = states.find(s => s.id === project.locationRefId);
    if (state) {
      setSelectedStateId(state.id);
    } else if (cityLocations.length > 0) {
      const city = cityLocations.find(c => c.id === project.locationRefId);
      if (city?.parentId) {
        setSelectedStateId(city.parentId);
        setSelectedCityId(city.id);
      }
    }
  }, [open, project, states, cityLocations]);

  const onSubmit = async (data: DevelopmentProjectFormValues) => {
    const payload: Record<string, unknown> = {
      name: data.name,
      description: data.description,
      slug: data.slug?.trim() || undefined,
      location: data.location,
      locationRefId: data.locationRefId,
      developer: data.developer?.trim() || undefined,
      status: data.status,
      expectedCompletionDate: data.expectedCompletionDate || undefined,
      progressPercentage: data.progressPercentage,
      images: images.map((img, i) => ({
        url: img.url,
        publicId: img.publicId,
        isCover: i === 0,
        displayOrder: i,
      })),
      featured: data.featured,
    };

    try {
      if (isEditing && project) {
        await updateProject.mutateAsync({ id: project.id, payload });
        notify({ type: 'success', title: 'Project updated', description: `"${data.name}" was updated.` });
      } else {
        await createProject.mutateAsync(payload);
        notify({ type: 'success', title: 'Project created', description: `"${data.name}" was created.` });
      }
      onClose();
    } catch (err) {
      notify({
        type: 'error',
        title: isConcurrencyConflict(err) ? 'This project just changed' : 'Could not save project',
        description: isConcurrencyConflict(err) ? CONCURRENCY_CONFLICT_DESCRIPTION : extractApiError(err),
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Project' : 'Add Project'}
      description={isEditing ? 'Update the project details below.' : 'Fill in the project details to create a new development project.'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Project Name" placeholder="e.g. Rayfield Heights" error={errors.name?.message} {...register('name')} />
        <Textarea label="Description" placeholder="Describe the development project." className="min-h-[100px]" error={errors.description?.message} {...register('description')} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="State" value={selectedStateId ?? ''} onChange={(e) => handleStateLocationChange(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Select state</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <div>
            <Select label="City / Location" value={selectedCityId ?? ''} onChange={(e) => handleCityChange(e.target.value ? Number(e.target.value) : null)}>
              <option value="">{selectedStateId ? 'Select city' : 'Select a state first'}</option>
              {cityLocations.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            {selectedStateId && (
              <button type="button" onClick={() => setShowCityModal(true)} className="mt-1 text-xs font-medium text-forest-600 hover:text-forest-700 transition-colors">
                + Add new city
              </button>
            )}
          </div>
          <Input label="Developer" placeholder="e.g. PIPDC" error={errors.developer?.message} {...register('developer')} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Select label="Status" error={errors.status?.message} {...register('status')}>
            {DEVELOPMENT_PROJECT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{developmentStatusLabel(s)}</option>
            ))}
          </Select>
          <Input label="Expected Completion" type="date" error={errors.expectedCompletionDate?.message} {...register('expectedCompletionDate')} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Input label="Progress %" type="number" min={0} max={100} placeholder="0" error={errors.progressPercentage?.message} {...register('progressPercentage', { setValueAs: toOptionalNumber })} />
          <Input label="Slug (optional)" placeholder="Auto-generated from name if blank" error={errors.slug?.message} {...register('slug')} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Project Images</label>
          <ImageUpload folder="development" value={images} onChange={setImages} maxFiles={10} />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-forest-500 focus:ring-forest-500" {...register('featured')} />
          Featured on home page
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>{isEditing ? 'Save changes' : 'Create project'}</Button>
        </div>
      </form>

      {showCityModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={() => { setShowCityModal(false); setNewCityName(''); }} />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-5 shadow-lift">
            <h3 className="text-lg font-semibold text-ink-900">Add City</h3>
            <p className="mt-1 text-sm text-ink-500">Add a city under {states.find(s => s.id === selectedStateId)?.name}</p>
            <input
              type="text"
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              placeholder="e.g. Jos, Bukuru, Shendam"
              className="mt-4 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCity(); } }}
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowCityModal(false); setNewCityName(''); }}>Cancel</Button>
              <Button type="button" variant="primary" size="sm" onClick={handleCreateCity} loading={createLocation.isPending}>Add city</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
