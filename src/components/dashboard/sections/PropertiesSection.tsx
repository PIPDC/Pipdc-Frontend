import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Star, MessageSquare, Search } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { PropertyForm } from '../../forms/PropertyForm';
import {
  useDeleteProperty,
  useSetFeatured,
  useChangePropertyStatus,
  useAssignPropertyAgent,
} from '../../../hooks/mutations';
import { useProperties, useAgents, useMyAgent } from '../../../hooks/queries';
import { useAuth } from '../../../contexts/AuthContext';
import { formatPrice, timeAgo } from '../../../utils/format';
import { extractApiError, isConcurrencyConflict, CONCURRENCY_CONFLICT_DESCRIPTION } from '../../../services/api';
import { useToast } from '../../ui/Toast';
import { primaryRole } from '../../../utils/roles';
import { cn } from '../../../utils/cn';
import { propertyStatusLabel, PROPERTY_STATUSES } from '../../../utils/propertyStatus';
import { CardTable, RowActions, LoadingRows, TableEmpty, thClass, tdClass, SectionFooter } from './shared';
import type { Property } from '../../../types';

const PAGE_SIZE = 10;

const statusTone: Record<string, 'forest' | 'gold' | 'neutral' | 'info' | 'danger'> = {
  Available: 'forest',
  Pending: 'gold',
  Sold: 'neutral',
  Rented: 'info',
  Unavailable: 'danger',
};

export function PropertiesSection() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldCreate = searchParams.get('new') === '1';

  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [formOpen, setFormOpen] = useState(shouldCreate);
  const [editing, setEditing] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState<Property | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { notify } = useToast();
  const deleteProperty = useDeleteProperty();
  const setFeatured = useSetFeatured();
  const changeStatus = useChangePropertyStatus();
  const assignAgent = useAssignPropertyAgent();

  const role = primaryRole(user?.roles);
  const myAgentQuery = useMyAgent(role === 'Agent');
  const agentId = role === 'Agent' ? myAgentQuery.data?.id : undefined;

  const propertiesQuery = useProperties(role === 'Agent' && agentId
    ? { agentId, pageNumber: page, pageSize: PAGE_SIZE, query: keyword || undefined }
    : { pageNumber: page, pageSize: PAGE_SIZE, query: keyword || undefined });
  const agentsQuery = useAgents();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    if (searchParams.get('new') === '1') {
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProperty.mutateAsync(deleting.id);
      notify({ type: 'success', title: 'Property deleted', description: `"${deleting.title}" was removed.` });
      setDeleting(null);
    } catch (err) {
      notify({ type: 'error', title: 'Could not delete property', description: extractApiError(err) });
    }
  };

  const toggleFeatured = async (p: Property) => {
    setTogglingId(p.id);
    try {
      await setFeatured.mutateAsync({ id: p.id, featured: !p.featured });
      notify({
        type: 'success',
        title: p.featured ? 'Removed from featured' : 'Featured property',
        description: p.featured
          ? `"${p.title}" no longer appears on the home page.`
          : `"${p.title}" will now appear on the home page.`,
      });
    } catch (err) {
      notify({
        type: 'error',
        title: isConcurrencyConflict(err) ? 'This property just changed' : 'Could not update featured',
        description: isConcurrencyConflict(err) ? CONCURRENCY_CONFLICT_DESCRIPTION : extractApiError(err),
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleStatusChange = async (p: Property, newStatus: string) => {
    if (newStatus === p.status) return;
    try {
      await changeStatus.mutateAsync({ id: p.id, status: newStatus });
      notify({ type: 'success', title: 'Status updated', description: `"${p.title}" is now ${propertyStatusLabel(newStatus as any)}.` });
    } catch (err) {
      notify({
        type: 'error',
        title: isConcurrencyConflict(err) ? 'This property just changed' : 'Could not update status',
        description: isConcurrencyConflict(err) ? CONCURRENCY_CONFLICT_DESCRIPTION : extractApiError(err),
      });
    }
  };

  const handleAgentChange = async (p: Property, newAgentId: string) => {
    const val = newAgentId === '' ? null : Number(newAgentId);
    if (val === p.agentId) return;
    try {
      await assignAgent.mutateAsync({ id: p.id, agentId: val });
      const agentName = val ? agents.find((a) => a.id === val)?.fullName ?? 'agent' : 'nobody';
      notify({ type: 'success', title: 'Agent reassigned', description: `"${p.title}" assigned to ${agentName}.` });
    } catch (err) {
      notify({
        type: 'error',
        title: isConcurrencyConflict(err) ? 'This property just changed' : 'Could not reassign agent',
        description: isConcurrencyConflict(err) ? CONCURRENCY_CONFLICT_DESCRIPTION : extractApiError(err),
      });
    }
  };

  const agents = agentsQuery.data?.items ?? [];
  const properties = propertiesQuery.data?.items ?? [];
  const totalCount = propertiesQuery.data?.totalCount ?? 0;

  return (
    <>
      <CardTable
        title={isAdmin ? 'All Properties' : 'My Properties'}
        actions={
          <Button variant="primary" size="sm" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
            Add Property
          </Button>
        }
      >
        <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setKeyword(searchInput); } }}
              className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm text-ink-700 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
            />
          </div>
        </div>
        {propertiesQuery.isLoading ? (
          <LoadingRows rows={5} />
        ) : properties.length === 0 ? (
          <TableEmpty />
        ) : (
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60">
                <th className={thClass}>Title</th>
                {isAdmin && <th className={thClass}>Agent</th>}
                <th className={thClass}>Price</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Enquiries</th>
                {isAdmin && <th className={thClass}>Featured</th>}
                <th className={thClass}>Listed</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {properties.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-ink-50/60">
                  <td className={tdClass}>
                    <span className="font-medium text-ink-900">{p.title}</span>
                    <span className="block text-xs text-ink-400">{p.address}, {p.city}</span>
                  </td>
                  {isAdmin && (
                    <td className={tdClass}>
                      <select
                        value={p.agentId ?? ''}
                        onChange={(e) => handleAgentChange(p, e.target.value)}
                        className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs text-ink-700 transition-colors hover:border-ink-300 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
                      >
                        <option value="">Unassigned</option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.id}>{a.fullName}</option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className={tdClass}>{formatPrice(p.price, p.currency)}</td>
                  <td className={tdClass}>
                    <select
                      value={p.status}
                      onChange={(e) => handleStatusChange(p, e.target.value)}
                      className={cn(
                        'rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs font-medium transition-colors hover:border-ink-300 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40',
                        `text-${statusTone[p.status] ?? 'neutral'}-700`,
                      )}
                    >
                      {PROPERTY_STATUSES.map((s) => (
                        <option key={s} value={s}>{propertyStatusLabel(s)}</option>
                      ))}
                    </select>
                  </td>
                  <td className={tdClass}>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-700">
                      <MessageSquare className="h-3 w-3 text-forest-500" />
                      {p.enquiryCount}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className={tdClass}>
                      <button
                        type="button"
                        onClick={() => toggleFeatured(p)}
                        disabled={togglingId === p.id}
                        title={p.featured ? 'Remove from home page' : 'Feature on home page'}
                        className={cn(
                          'rounded-lg p-1.5 transition-colors',
                          p.featured ? 'text-gold-500 hover:text-gold-600' : 'text-ink-300 hover:text-gold-500',
                          togglingId === p.id && 'animate-pulse',
                        )}
                      >
                        <Star className={cn('h-5 w-5', p.featured && 'fill-gold-500')} />
                      </button>
                    </td>
                  )}
                  <td className={tdClass}>{timeAgo(p.createdAt)}</td>
                  <td className={tdClass}>
                    <RowActions
                      viewUrl={`/properties/${p.slug}`}
                      onEdit={() => { setEditing(p); setFormOpen(true); }}
                      onDelete={() => setDeleting(p)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <SectionFooter pageNumber={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
      </CardTable>

      <PropertyForm open={formOpen} property={editing} agents={agents} onClose={closeForm} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete property"
        description={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`}
        confirmLabel="Delete property"
        loading={deleteProperty.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
