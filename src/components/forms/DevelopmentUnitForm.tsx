import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Input';
import { useCreateDevelopmentUnit, useUpdateDevelopmentUnit } from '../../hooks/mutations';
import { useToast } from '../ui/Toast';
import { extractApiError } from '../../services/api';
import { DEVELOPMENT_UNIT_STATUS_OPTIONS, unitStatusLabel } from '../../utils/developmentStatus';
import type { DevelopmentUnit } from '../../types/development';
import type { PropertyType } from '../../types';

// Mirrors PropertyForm, because a unit is what gets listed and must be able to
// carry the same description of the house.
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

const listingTypes = ['ForSale', 'ForLease'] as const;
const sizeUnits = ['sqm', 'sqft'] as const;

const optionalNumber = z.number({ message: 'Enter a valid number' }).int().min(0).optional();
const optionalDecimal = z.number({ message: 'Enter a valid number' }).min(0).optional();

const schema = z.object({
  unitIdentifier: z.string().min(1, 'Unit identifier is required').max(50),
  unitType: z.string().min(1, 'Unit type is required').max(100),
  status: z.string().min(1, 'Status is required'),
  price: z.number({ message: 'Enter a valid price' }).min(0).optional(),
  currency: z.string().optional(),
  description: z.string().optional(),
  listingType: z.enum(listingTypes),
  propertyType: z.enum(propertyTypes as [PropertyType, ...PropertyType[]]),
  period: z.string().optional(),
  bedrooms: optionalNumber,
  bathrooms: optionalNumber,
  size: optionalDecimal,
  sizeUnit: z.enum(sizeUnits),
  yearBuilt: optionalNumber,
  amenities: z.string().optional(),
});

type UnitFormValues = z.infer<typeof schema>;

const toOptionalNumber = (value: unknown) => (value === '' || value === null || value === undefined ? undefined : Number(value));

// Entered as free text for convenience, sent as a clean list.
const parseAmenities = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);

interface DevelopmentUnitFormProps {
  open: boolean;
  projectId: number;
  unit: DevelopmentUnit | null;
  onClose: () => void;
}

export function DevelopmentUnitForm({ open, projectId, unit, onClose }: DevelopmentUnitFormProps) {
  const { notify } = useToast();
  const createUnit = useCreateDevelopmentUnit();
  const updateUnit = useUpdateDevelopmentUnit();
  const isEditing = Boolean(unit);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UnitFormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!open) return;
    if (unit) {
      reset({
        unitIdentifier: unit.unitIdentifier,
        unitType: unit.unitType,
        status: unit.status,
        price: unit.price ?? undefined,
        currency: unit.currency ?? 'NGN',
        description: unit.description ?? '',
        listingType: unit.listingType === 'ForLease' ? 'ForLease' : 'ForSale',
        propertyType: propertyTypes.includes(unit.propertyType as PropertyType)
          ? (unit.propertyType as PropertyType)
          : 'Residential',
        period: unit.period ?? '',
        bedrooms: unit.bedrooms ?? undefined,
        bathrooms: unit.bathrooms ?? undefined,
        size: unit.size ?? undefined,
        sizeUnit: unit.sizeUnit === 'sqft' ? 'sqft' : 'sqm',
        yearBuilt: unit.yearBuilt ?? undefined,
        amenities: (unit.amenities ?? []).join(', '),
      });
    } else {
      reset({
        unitIdentifier: '',
        unitType: '',
        status: 'Available',
        price: undefined,
        currency: 'NGN',
        description: '',
        listingType: 'ForSale',
        propertyType: 'Residential',
        period: '',
        bedrooms: undefined,
        bathrooms: undefined,
        size: undefined,
        sizeUnit: 'sqm',
        yearBuilt: undefined,
        amenities: '',
      });
    }
  }, [open, unit, reset]);

  const onSubmit = async (data: UnitFormValues) => {
    const payload: Record<string, unknown> = {
      unitIdentifier: data.unitIdentifier,
      unitType: data.unitType,
      status: data.status,
      price: data.price,
      currency: data.currency || 'NGN',
      description: data.description?.trim() || undefined,
      listingType: data.listingType,
      propertyType: data.propertyType,
      period: data.period?.trim() || undefined,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      size: data.size,
      sizeUnit: data.sizeUnit,
      yearBuilt: data.yearBuilt,
      amenities: parseAmenities(data.amenities),
    };

    try {
      if (isEditing && unit) {
        await updateUnit.mutateAsync({ projectId, unitId: unit.id, payload });
        notify({ type: 'success', title: 'Unit updated', description: `"${data.unitIdentifier}" was updated.` });
      } else {
        await createUnit.mutateAsync({ projectId, payload });
        notify({ type: 'success', title: 'Unit added', description: `"${data.unitIdentifier}" was added.` });
      }
      onClose();
    } catch (err) {
      notify({ type: 'error', title: 'Could not save unit', description: extractApiError(err) });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Unit' : 'Add Unit'}
      description={isEditing ? 'Update the unit details below.' : 'Add a new unit to this project.'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Unit Identifier" placeholder="e.g. Unit 1A, Block B Penthouse" error={errors.unitIdentifier?.message} {...register('unitIdentifier')} />
        <Input label="Unit Type" placeholder="e.g. 2BR Apartment, Commercial Space" error={errors.unitType?.message} {...register('unitType')} />

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Select label="Status" error={errors.status?.message} {...register('status')}>
            {DEVELOPMENT_UNIT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{unitStatusLabel(s)}</option>
            ))}
          </Select>
          <Select label="Currency" error={errors.currency?.message} {...register('currency')}>
            {['NGN', 'USD', 'EUR', 'GBP'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>

        <Input label="Price" type="number" step="any" placeholder="0" error={errors.price?.message} {...register('price', { setValueAs: toOptionalNumber })} />

        <p className="rounded-lg bg-gold-50 px-3 py-2 text-xs text-ink-700">
          When this project is completed, a unit with a price becomes a listing of
          its own. Fill in the details below so the listing is complete when it appears.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Select label="Listing type" error={errors.listingType?.message} {...register('listingType')}>
            {listingTypes.map((t) => (
              <option key={t} value={t}>{t === 'ForSale' ? 'For sale' : 'For rent'}</option>
            ))}
          </Select>
          <Select label="Property type" error={errors.propertyType?.message} {...register('propertyType')}>
            {propertyTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Input label="Bedrooms" type="number" placeholder="e.g. 4" error={errors.bedrooms?.message} {...register('bedrooms', { setValueAs: toOptionalNumber })} />
          <Input label="Bathrooms" type="number" placeholder="e.g. 3" error={errors.bathrooms?.message} {...register('bathrooms', { setValueAs: toOptionalNumber })} />
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Input label="Size" type="number" step="any" placeholder="e.g. 180" error={errors.size?.message} {...register('size', { setValueAs: toOptionalNumber })} />
          <Select label="Size unit" error={errors.sizeUnit?.message} {...register('sizeUnit')}>
            {sizeUnits.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Input label="Year built" type="number" placeholder="e.g. 2026" error={errors.yearBuilt?.message} {...register('yearBuilt', { setValueAs: toOptionalNumber })} />
        </div>

        <Input label="Rental period" placeholder="e.g. Per annum" error={errors.period?.message} {...register('period')} />
        <Input label="Amenities" placeholder="Comma separated, e.g. 24/7 power, gated estate, fitted kitchen" error={errors.amenities?.message} {...register('amenities')} />

        <Textarea label="Description" placeholder="Optional description for this unit." className="min-h-[80px]" error={errors.description?.message} {...register('description')} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>{isEditing ? 'Save changes' : 'Add unit'}</Button>
        </div>
      </form>
    </Modal>
  );
}
