import type { PropertyStatus } from '../types';

export const PROPERTY_STATUSES: PropertyStatus[] = [
  'Available',
  'Pending',
  'Sold',
  'Rented',
  'Unavailable',
];

const DISPLAY_LABELS: Record<PropertyStatus, string> = {
  Available: 'Available',
  Pending: 'Pending',
  Sold: 'Sold',
  Rented: 'Rented',
  Unavailable: 'Unavailable',
};

export function propertyStatusLabel(status: PropertyStatus): string {
  return DISPLAY_LABELS[status] ?? status;
}

export function listingTypeLabel(listingType: string): string {
  if (listingType === 'ForLease') return 'For Rent';
  if (listingType === 'ForSale') return 'For Sale';
  return listingType;
}

/**
 * The statuses that make sense for a given listing type.
 *
 * A property offered for sale cannot be "Rented", and one offered for rent
 * cannot be "Sold". Offering both in a status dropdown lets an admin record a
 * state that contradicts the listing itself, and it was the reason the sold/rent
 * combo boxes looked wrong. Pending and Unavailable apply to either, and
 * Available is the state a new listing starts in.
 *
 * Passing no listing type returns every status, so read-only displays and
 * search filters that are not scoped to one listing keep the full list.
 */
export function propertyStatusesForListingType(listingType: string | null | undefined): PropertyStatus[] {
  if (listingType === 'ForSale') return ['Available', 'Pending', 'Sold', 'Unavailable'];
  if (listingType === 'ForLease') return ['Available', 'Pending', 'Rented', 'Unavailable'];
  return PROPERTY_STATUSES;
}

/**
 * Whether a status change to `next` conflicts with the property's listing type.
 *
 * Used when a property is already stored in a state that no longer matches its
 * listing type: the status has to stay selectable so the admin can correct it,
 * rather than the current value silently disappearing from its own dropdown.
 */
export function isStatusValidForListingType(status: string, listingType: string | null | undefined): boolean {
  return propertyStatusesForListingType(listingType).includes(status as PropertyStatus);
}
