import { useState } from 'react';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { useLocations } from '../../../hooks/queries';
import { useCreateLocation, useDeleteLocation } from '../../../hooks/mutations';
import { extractApiError } from '../../../services/api';
import { useToast } from '../../ui/Toast';
import { CardTable, LoadingRows, TableEmpty, thClass, tdClass } from './shared';
import type { Location, LocationType } from '../../../types';

const typeTone: Record<LocationType, 'forest' | 'gold' | 'neutral' | 'info'> = {
  State: 'forest',
  LGA: 'gold',
  City: 'info',
  Area: 'neutral',
};

function CityRow({
  city,
  onDelete,
}: {
  city: Location;
  onDelete: (loc: Location) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: areas = [], isLoading: areasLoading } = useLocations(
    expanded ? { parentId: city.id } : undefined,
  );

  return (
    <>
      <tr className="bg-ink-50/30 transition-colors hover:bg-ink-50/60">
        <td className={tdClass}>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 pl-8 text-left"
          >
            <ChevronRight
              className={`h-4 w-4 text-ink-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
            <span className="font-medium text-ink-700">{city.name}</span>
            <span className="text-xs text-ink-400">{city.slug}</span>
          </button>
        </td>
        <td className={tdClass}><Badge tone={typeTone[city.type]}>{city.type}</Badge></td>
        <td className={tdClass}>{city.childCount}</td>
        <td className={tdClass}>
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onDelete(city)}
              title="Delete"
              className="rounded-lg p-2.5 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <>
          {areasLoading ? (
            <tr>
              <td colSpan={4} className="px-10 py-3 text-sm text-ink-400">Loading areas...</td>
            </tr>
          ) : areas.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-10 py-3 text-sm text-ink-400">No areas yet.</td>
            </tr>
          ) : (
            areas.map((area) => (
              <tr key={area.id} className="bg-ink-50/20 transition-colors hover:bg-ink-50/40">
                <td className={tdClass}>
                  <span className="pl-16 font-medium text-ink-600">{area.name}</span>
                  <span className="ml-2 block pl-16 text-xs text-ink-400">{area.slug}</span>
                </td>
                <td className={tdClass}><Badge tone={typeTone[area.type]}>{area.type}</Badge></td>
                <td className={tdClass}>{area.childCount}</td>
                <td className={tdClass}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onDelete(area)}
                      title="Delete"
                      className="rounded-lg p-2.5 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </>
      )}
    </>
  );
}

function StateRow({
  state,
  expanded,
  onToggle,
  onAddCity,
  onDelete,
}: {
  state: Location;
  expanded: boolean;
  onToggle: () => void;
  onAddCity: () => void;
  onDelete: (loc: Location) => void;
}) {
  const { data: children = [], isLoading: childrenLoading } = useLocations(
    expanded ? { parentId: state.id } : undefined,
  );

  return (
    <>
      <tr className="transition-colors hover:bg-ink-50/60">
        <td className={tdClass}>
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 text-left"
          >
            <ChevronRight
              className={`h-4 w-4 text-ink-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
            <span className="font-medium text-ink-900">{state.name}</span>
            <span className="text-xs text-ink-400">{state.slug}</span>
          </button>
        </td>
        <td className={tdClass}><Badge tone={typeTone[state.type]}>{state.type}</Badge></td>
        <td className={tdClass}>{state.childCount}</td>
        <td className={tdClass}>
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="ghost" size="sm" onClick={onAddCity} leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Add City
            </Button>
            <button
              type="button"
              onClick={() => onDelete(state)}
              title="Delete"
              className="rounded-lg p-2.5 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <>
          {childrenLoading ? (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-sm text-ink-400">Loading cities...</td>
            </tr>
          ) : children.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-sm text-ink-400">No cities yet.</td>
            </tr>
          ) : (
            children.map((child) => (
              <CityRow key={child.id} city={child} onDelete={onDelete} />
            ))
          )}
        </>
      )}
    </>
  );
}

export function LocationsSection() {
  const { data: states = [], isLoading } = useLocations({ type: 'State' });
  const { notify } = useToast();
  const createLocation = useCreateLocation();
  const deleteLocation = useDeleteLocation();

  const [formOpen, setFormOpen] = useState(false);
  const [parentType, setParentType] = useState<LocationType>('State');
  const [parentId, setParentId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [deleting, setDeleting] = useState<Location | null>(null);
  const [expandedStateId, setExpandedStateId] = useState<number | null>(null);

  const resetForm = () => {
    setFormOpen(false);
    setParentType('State');
    setParentId(null);
    setName('');
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const childType = parentType === 'State' ? 'City' : parentType === 'City' ? 'Area' : 'Area';
    try {
      await createLocation.mutateAsync({ name: name.trim(), type: parentId ? childType : 'State', parentId });
      notify({ type: 'success', title: 'Location created', description: `"${name.trim()}" was added.` });
      resetForm();
    } catch (err) {
      notify({ type: 'error', title: 'Could not create location', description: extractApiError(err) });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteLocation.mutateAsync(deleting.id);
      notify({ type: 'success', title: 'Location deleted', description: `"${deleting.name}" was removed.` });
      setDeleting(null);
    } catch (err) {
      notify({ type: 'error', title: 'Could not delete location', description: extractApiError(err) });
    }
  };

  const openAddChild = (type: LocationType, id: number) => {
    setParentType(type);
    setParentId(id);
    setFormOpen(true);
  };

  return (
    <>
      <CardTable
        title="Locations"
        actions={
          <Button variant="primary" size="sm" onClick={() => { setParentType('State'); setParentId(null); setFormOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>
            Add State
          </Button>
        }
      >
        {isLoading ? (
          <LoadingRows rows={5} />
        ) : states.length === 0 ? (
          <TableEmpty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60">
                  <th className={thClass}>Name</th>
                  <th className={thClass}>Type</th>
                  <th className={thClass}>Cities</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {states.map((s) => (
                  <StateRow
                    key={s.id}
                    state={s}
                    expanded={expandedStateId === s.id}
                    onToggle={() => setExpandedStateId(expandedStateId === s.id ? null : s.id)}
                    onAddCity={() => openAddChild('State', s.id)}
                    onDelete={setDeleting}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardTable>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm" onClick={resetForm}>
          <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-ink-900">Add Location</h2>
            <p className="mt-1 text-sm text-ink-500">
              {parentId ? `Adding a child under the selected location.` : 'Adding a new top-level state.'}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-ink-700">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
                  placeholder={parentId ? 'e.g. Jos' : 'e.g. Plateau'}
                  autoFocus
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
              <Button variant="primary" size="sm" loading={createLocation.isPending} onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete location"
        description={`Are you sure you want to delete "${deleting?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLocation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
