import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Input';
import { ImageUpload } from '../ui/ImageUpload';
import { useCreateProperty, useUpdateProperty, useCreateLocation } from '../../hooks/mutations';
import { useLocations } from '../../hooks/queries';
import { useToast } from '../ui/Toast';
import { extractApiError, isConcurrencyConflict, CONCURRENCY_CONFLICT_DESCRIPTION } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { propertyStatusLabel } from '../../utils/propertyStatus';
import type { Property, PropertyType } from '../../types';
import type { UploadResult } from '../../services/imageService';

const propertyTypes: PropertyType[] = [
  'Detached House',
  'Semi-Detached',
  'Terrace',
  'Apartment',
  'Penthouse',
  'Villa',
  'Mansion',
  'Land',
  'Commercial',
  'Townhouse',
  'Residential',
  'Industrial',
  'Mixed',
];

const statuses = ['Available', 'Pending', 'Sold', 'Rented', 'Unavailable'] as const;
const listingTypes = ['ForSale', 'ForLease'] as const;

const optionalNumber = z.number({ message: 'Enter a valid number' }).int().min(0).optional();
const optionalDecimal = z.number({ message: 'Enter a valid number' }).min(0).optional();

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  slug: z.string().optional(),
  price: z.number({ message: 'Enter a valid price' }).min(0),
  currency: z.string().min(1, 'Currency is required'),
  period: z.string().optional(),
  status: z.enum(statuses),
  listingType: z.enum(listingTypes),
  type: z.string().min(1, 'Type is required'),
  bedrooms: optionalNumber,
  bathrooms: optionalNumber,
  size: optionalDecimal,
  sizeUnit: z.string().min(1, 'Size unit is required'),
  lotSize: optionalDecimal,
  yearBuilt: optionalNumber,
  address: z.string().min(5, 'Address is required'),
  state: z.string().min(2, 'State is required'),
  city: z.string().min(2, 'City is required'),
  area: z.string().optional(),
  locationId: z.number().optional(),
  latitude: z.number({ message: 'Enter a valid number' }).min(-90).max(90).optional(),
  longitude: z.number({ message: 'Enter a valid number' }).min(-180).max(180).optional(),
  amenities: z.string().optional(),
  featured: z.boolean(),
  agentId: z.union([z.literal(''), z.number({ message: 'Select an agent' }).int().positive()]).optional(),
});

type PropertyFormValues = z.infer<typeof schema>;

const toOptionalNumber = (value: unknown) => (value === '' || value === null || value === undefined ? undefined : Number(value));

interface PropertyFormProps {
  open: boolean;
  property: Property | null;
  agents: { id: number; fullName: string }[];
  onClose: () => void;
}

export function PropertyForm({ open, property, agents, onClose }: PropertyFormProps) {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const isAgent = user?.roles.includes('Agent') ?? false;
  const { notify } = useToast();
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const { register, handleSubmit, reset, setError, setValue, formState: { errors, isSubmitting } } = useForm<PropertyFormValues>({
    resolver: zodResolver(schema),
  });

  const isEditing = Boolean(property);
  const [images, setImages] = useState<UploadResult[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [showCityModal, setShowCityModal] = useState(false);
  const [newCityName, setNewCityName] = useState('');

  const { data: states = [] } = useLocations({ type: 'State' });
  const { data: cities = [] } = useLocations(selectedStateId ? { parentId: selectedStateId } : undefined);
  const cityLocations = cities.filter(l => l.type === 'City' || l.type === 'LGA');
  const createLocation = useCreateLocation();

  const handleStateLocationChange = (id: number | null) => {
    setSelectedStateId(id);
    setSelectedCityId(null);
    setValue('locationId', id ?? undefined, { shouldDirty: true });
    setValue('city', '', { shouldDirty: true });
    if (id) {
      const state = states.find(s => s.id === id);
      if (state) setValue('state', state.name, { shouldDirty: true });
    }
  };

  const handleCityChange = (cityId: number | null) => {
    setSelectedCityId(cityId);
    if (cityId) {
      const city = cityLocations.find(c => c.id === cityId);
      if (city) {
        setValue('city', city.name, { shouldDirty: true });
        setValue('locationId', cityId, { shouldDirty: true });
      }
    } else if (selectedStateId) {
      setValue('locationId', selectedStateId, { shouldDirty: true });
    }
  };

  const handleCreateCity = async () => {
    const name = newCityName.trim();
    if (!name || !selectedStateId) return;
    try {
      const result = await createLocation.mutateAsync({ name, type: 'City', parentId: selectedStateId });
      if (result?.id) {
        setSelectedCityId(result.id);
        setValue('city', result.name, { shouldDirty: true });
        setValue('locationId', result.id, { shouldDirty: true });
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
    if (property) {
      reset({
        title: property.title,
        description: property.description,
        slug: property.slug ?? '',
        price: property.price,
        currency: property.currency,
        period: property.period ?? '',
        status: property.status,
        listingType: property.listingType || 'ForSale',
        type: property.type,
        bedrooms: property.bedrooms ?? undefined,
        bathrooms: property.bathrooms ?? undefined,
        size: property.size ?? undefined,
        sizeUnit: property.sizeUnit,
        lotSize: property.lotSize ?? undefined,
        yearBuilt: property.yearBuilt ?? undefined,
        address: property.address,
        state: property.state,
        city: property.city,
        area: property.area ?? '',
        locationId: property.locationId ?? undefined,
        latitude: property.latitude ?? undefined,
        longitude: property.longitude ?? undefined,
        amenities: (property.amenities ?? []).join('\n'),
        featured: property.featured,
        agentId: property.agentId,
      });
      setImages((property.images ?? []).map((url, i) => ({ url, publicId: `existing-${i}` })));
    } else {
      reset({
        title: '',
        description: '',
        slug: '',
        price: undefined,
        currency: 'NGN',
        period: '',
        status: 'Available',
        listingType: 'ForSale',
        type: 'Apartment',
        bedrooms: undefined,
        bathrooms: undefined,
        size: undefined,
        sizeUnit: 'sqm',
        lotSize: undefined,
        yearBuilt: undefined,
        address: '',
        state: '',
        city: '',
        area: '',
        locationId: undefined,
        latitude: undefined,
        longitude: undefined,
        amenities: '',
        featured: false,
        agentId: '',
      });
      setImages([]);
      setSelectedStateId(null);
      setSelectedCityId(null);
    }
  }, [open, property, reset]);

  useEffect(() => {
    if (!open || !property?.locationId || states.length === 0) return;
    const state = states.find(s => s.id === property.locationId);
    if (state) {
      setSelectedStateId(state.id);
    } else if (cityLocations.length > 0) {
      const city = cityLocations.find(c => c.id === property.locationId);
      if (city?.parentId) {
        setSelectedStateId(city.parentId);
        setSelectedCityId(city.id);
      }
    }
  }, [open, property, states, cityLocations]);

  const parseList = (value?: string): string[] =>
    (value ?? '')
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

  const onSubmit = async (data: PropertyFormValues) => {
    const agentId = isAdmin && typeof data.agentId === 'number' ? data.agentId : undefined;
    if (isAdmin && !agentId) {
      setError('agentId', { message: 'Select an agent to assign this property to.' });
      return;
    }

    const payload: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      slug: data.slug?.trim() || undefined,
      price: data.price,
      currency: data.currency,
      period: data.period?.trim() || undefined,
      status: data.status,
      listingType: data.listingType,
      type: data.type,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      size: data.size,
      sizeUnit: data.sizeUnit,
      lotSize: data.lotSize,
      yearBuilt: data.yearBuilt,
      address: data.address,
      state: data.state,
      city: data.city,
      area: data.area?.trim() || undefined,
      locationId: data.locationId,
      latitude: data.latitude,
      longitude: data.longitude,
      amenities: parseList(data.amenities),
      images: images.map((img) => img.url),
      featured: isAdmin ? data.featured : false,
      agentId,
    };

    try {
      if (isEditing && property) {
        await updateProperty.mutateAsync({ id: property.id, payload });
        notify({ type: 'success', title: 'Property updated', description: `"${data.title}" was updated.` });
      } else {
        await createProperty.mutateAsync(payload);
        notify({ type: 'success', title: 'Property created', description: `"${data.title}" was listed.` });
      }
      onClose();
    } catch (err) {
      notify({
        type: 'error',
        title: isConcurrencyConflict(err) ? 'This property just changed' : 'Could not save property',
        description: isConcurrencyConflict(err) ? CONCURRENCY_CONFLICT_DESCRIPTION : extractApiError(err),
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Property' : 'Add Property'}
      description={isEditing ? 'Update the listing details below.' : 'Fill in the listing details to publish a new property.'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Title" placeholder="e.g. 3-Bedroom Detached House in Abuja" error={errors.title?.message} {...register('title')} />
        <Textarea label="Description" placeholder="Describe the property, its features and surroundings." className="min-h-[100px]" error={errors.description?.message} {...register('description')} />

        <div className="grid grid-cols-[1fr_1fr] gap-3 sm:gap-4">
          <Input label="Price" type="number" step="any" placeholder="0" error={errors.price?.message} {...register('price', { setValueAs: toOptionalNumber })} />
          <Select label="Currency" error={errors.currency?.message} {...register('currency')}>
            {['NGN', 'USD', 'EUR', 'GBP'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Input label="Period (for rentals)" placeholder="e.g. Per annum" error={errors.period?.message} {...register('period')} />
          <Select label="Status" error={errors.status?.message} {...register('status')}>
            {statuses.map((s) => (
              <option key={s} value={s}>{propertyStatusLabel(s)}</option>
            ))}
          </Select>
          <Select label="Listing type" error={errors.listingType?.message} {...register('listingType')}>
            <option value="ForSale">For Sale</option>
            <option value="ForLease">For Rent</option>
          </Select>
          <Select label="Type" error={errors.type?.message} {...register('type')}>
            {propertyTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <Input label="Bedrooms" type="number" placeholder="e.g. 4" error={errors.bedrooms?.message} {...register('bedrooms', { setValueAs: toOptionalNumber })} />
          <Input label="Bathrooms" type="number" placeholder="e.g. 3" error={errors.bathrooms?.message} {...register('bathrooms', { setValueAs: toOptionalNumber })} />
          <Input label="Year built" type="number" placeholder="e.g. 2022" error={errors.yearBuilt?.message} {...register('yearBuilt', { setValueAs: toOptionalNumber })} />
          <Input label="Size" type="number" step="any" placeholder="e.g. 400" error={errors.size?.message} {...register('size', { setValueAs: toOptionalNumber })} />
          <Select label="Size unit" error={errors.sizeUnit?.message} {...register('sizeUnit')}>
            {['sqm', 'sqft', 'acres', 'hectares'].map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Select>
          <Input label="Lot size" type="number" step="any" placeholder="e.g. 800" error={errors.lotSize?.message} {...register('lotSize', { setValueAs: toOptionalNumber })} />
        </div>

        <Input label="Address" placeholder="Street address" error={errors.address?.message} {...register('address')} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="State" value={selectedStateId ?? ''} onChange={(e) => handleStateLocationChange(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Select state</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <div>
            <Select label="City" value={selectedCityId ?? ''} onChange={(e) => handleCityChange(e.target.value ? Number(e.target.value) : null)}>
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
          <Input label="Area" placeholder="Neighbourhood / district" error={errors.area?.message} {...register('area')} />
        </div>

        <Input label="Slug (optional)" placeholder="Auto-generated from title if blank" error={errors.slug?.message} {...register('slug')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Latitude" type="number" step="any" placeholder="e.g. 9.0765" error={errors.latitude?.message} {...register('latitude', { setValueAs: toOptionalNumber })} />
          <Input label="Longitude" type="number" step="any" placeholder="e.g. 7.3986" error={errors.longitude?.message} {...register('longitude', { setValueAs: toOptionalNumber })} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Textarea label="Amenities (one per line)" placeholder={'Air conditioning\nGarage\nSwimming pool'} className="min-h-[80px]" error={errors.amenities?.message} {...register('amenities')} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Property Images</label>
            <ImageUpload folder="properties" value={images} onChange={setImages} maxFiles={10} />
          </div>
        </div>

        {isAdmin && (
          <>
            <Select label="Assigned agent" error={errors.agentId?.message} {...register('agentId', { setValueAs: toOptionalNumber })}>
              <option value="">Select an agent</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.fullName}</option>
              ))}
            </Select>
            <label className="inline-flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-forest-500 focus:ring-forest-500" {...register('featured')} />
              Featured listing
            </label>
          </>
        )}

        {isAgent && !isAdmin && (
          <p className="text-xs text-ink-500">The property will be assigned to your agent profile.</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>{isEditing ? 'Save changes' : 'Publish property'}</Button>
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
