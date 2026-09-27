import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Home, Tag, Bed, Wallet } from 'lucide-react';
import { Select } from '../ui/Input';
import { Button } from '../ui/Button';
import type { PropertyFilters, PropertyType, PropertyStatus } from '../../types';
import { useLocations } from '../../hooks/queries';
import { propertyStatusLabel } from '../../utils/propertyStatus';

interface SearchFilterProps {
  filters: PropertyFilters;
  onChange: (next: PropertyFilters) => void;
  onSearch?: () => void;
  compact?: boolean;
}

const propertyTypes: (PropertyType | 'All')[] = [
  'All', 'Detached House', 'Semi-Detached', 'Terrace', 'Apartment', 'Penthouse', 'Villa', 'Mansion', 'Land', 'Commercial', 'Townhouse',
];
const statuses: (PropertyStatus | 'All')[] = ['All', 'Available', 'Pending', 'Sold', 'Rented', 'Unavailable'];
const listingTypes = ['All', 'ForSale', 'ForLease'] as const;

export function SearchFilter({ filters, onChange, onSearch, compact }: SearchFilterProps) {
  const navigate = useNavigate();

  const { data: states = [] } = useLocations({ type: 'State' });
  const { data: cities = [] } = useLocations(
    filters.locationId && states.find(s => s.id === filters.locationId)
      ? undefined
      : undefined
  );

  const selectedStateId = (() => {
    if (!filters.locationId) return '';
    const state = states.find(s => s.id === filters.locationId);
    return state ? String(state.id) : '';
  })();

  const selectedCityId = (() => {
    if (!filters.locationId) return '';
    const city = cities.find(c => c.id === filters.locationId && c.type !== 'State');
    return city ? String(city.id) : '';
  })();

  const { data: childLocations = [] } = useLocations(
    selectedStateId ? { parentId: Number(selectedStateId) } : undefined
  );
  const citiesForState = childLocations.filter(l => l.type === 'City' || l.type === 'LGA');

  const handleStateChange = (stateId: string) => {
    if (stateId === 'All') {
      onChange({ ...filters, locationId: undefined, location: undefined });
    } else {
      onChange({ ...filters, locationId: Number(stateId), location: undefined });
    }
  };

  const handleCityChange = (cityId: string) => {
    if (cityId === 'All') {
      onChange({ ...filters, locationId: Number(selectedStateId), location: undefined });
    } else {
      onChange({ ...filters, locationId: Number(cityId), location: undefined });
    }
  };

  const handleSearch = () => {
    onSearch?.();
    if (!onSearch) navigate('/properties');
  };

  return (
      <div className={compact ? 'mx-auto grid w-full max-w-3xl gap-3 lg:grid-cols-8' : 'grid gap-3 md:grid-cols-2 lg:grid-cols-8'}>
      <div className="lg:col-span-1">
        <Select
          aria-label="State"
          value={selectedStateId || 'All'}
          onChange={(e) => handleStateChange(e.target.value)}
        >
          <option value="All">All States</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      </div>
      {citiesForState.length > 0 && (
        <div className="lg:col-span-1">
          <Select
            aria-label="City"
            value={selectedCityId || 'All'}
            onChange={(e) => handleCityChange(e.target.value)}
          >
            <option value="All">All Cities</option>
            {citiesForState.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      )}
      <div className="lg:col-span-1">
        <Select
          aria-label="Property type"
          value={filters.type ?? 'All'}
          onChange={(e) => onChange({ ...filters, type: e.target.value as PropertyType | 'All' })}
        >
          {propertyTypes.map((t) => (
            <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
          ))}
        </Select>
      </div>
      <div className="lg:col-span-1">
        <Select
          aria-label="Status"
          value={filters.status ?? 'All'}
          onChange={(e) => onChange({ ...filters, status: e.target.value as PropertyStatus | 'All' })}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All Statuses' : propertyStatusLabel(s)}</option>
          ))}
        </Select>
      </div>
      <div className="lg:col-span-1">
        <Select
          aria-label="Listing type"
          value={filters.listingType ?? 'All'}
          onChange={(e) => onChange({ ...filters, listingType: e.target.value === 'All' ? undefined : e.target.value })}
        >
          {listingTypes.map((lt) => (
            <option key={lt} value={lt}>{lt === 'All' ? 'All Listing Types' : lt === 'ForSale' ? 'For Sale' : 'For Rent'}</option>
          ))}
        </Select>
      </div>
      <div className="lg:col-span-1">
        <Select
          aria-label="Bedrooms"
          value={filters.bedrooms ?? 0}
          onChange={(e) => onChange({ ...filters, bedrooms: Number(e.target.value) || undefined })}
        >
          <option value={0}>Any Bedrooms</option>
          <option value={1}>1+ Bedrooms</option>
          <option value={2}>2+ Bedrooms</option>
          <option value={3}>3+ Bedrooms</option>
          <option value={4}>4+ Bedrooms</option>
          <option value={5}>5+ Bedrooms</option>
        </Select>
      </div>
      <div className="lg:col-span-1">
        <Select
          aria-label="Max price"
          value={filters.maxPrice ?? 0}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) || undefined })}
        >
          <option value={0}>Any Price</option>
          <option value={30000000}>Up to ₦30M</option>
          <option value={60000000}>Up to ₦60M</option>
          <option value={100000000}>Up to ₦100M</option>
          <option value={200000000}>Up to ₦200M</option>
          <option value={500000000}>Up to ₦500M</option>
        </Select>
      </div>
      <div className="lg:col-span-1 lg:justify-self-center">
        <Button onClick={handleSearch} size="lg" className="w-full lg:w-auto" leftIcon={<Search className="h-4 w-4" />}>
          Search
        </Button>
      </div>
    </div>
  );
}

export function SearchFilterCard(props: SearchFilterProps) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-700">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-50 text-forest-600">
          <Search className="h-4 w-4" />
        </span>
        Find your property
      </div>
      <SearchFilter {...props} />
    </div>
  );
}

// silence unused imports for tree-shaking friendliness
void MapPin; void Home; void Tag; void Bed; void Wallet;
