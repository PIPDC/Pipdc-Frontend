import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Star, MessageSquare, Search, Lock } from 'lucide-react';
import { Button } from '../../ui/Button';
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
import { propertyStatusLabel, isStatusValidForListingType, propertyStatusesForListingType } from '../../../utils/propertyStatus';
import { CardTable, RowActions, LoadingRows, TableEmpty, thClass, tdClass, SectionFooter } from './shared';
import { RecordTransactionDialog } from './RecordTransactionDialog';
import type { Property, PropertyStatus } from '../../../types';

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
  const [transactionProperty, setTransactionProperty] = useState<Property | null>(null);
  const [transactionOutcome, setTransactionOutcome] = useState<'Sold' | 'Rented' | null>(null);

  const { notify } = useToast();
  const deleteProperty = useDeleteProperty();
  const setFeatured = useSetFeatured();
  const changeStatus = useChangePropertyStatus();
  const assignAgent = useAssignPropertyAgent();

  const role = primaryRole(user?.roles);
  const myAgentQuery = useMyAgent(role === 'Agent');
  const agentId = role === 'Agent' ? myAgentQuery.data?.id : undefined;

  const propertiesQuery = useProperties(role === 'Agent' && agentId
    ? { agentId, page, pageSize: PAGE_SIZE, query: keyword || undefined }
    : { page, pageSize: PAGE_SIZE, query: keyword || undefined });
  // The agent-assignment dropdown must offer every approved agent, including
  // ones the admin has not verified yet, so it opts into the moderated list.
  const agentsQuery = useAgents({ includeModerated: true });

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

  const handleStatusChange = async (p: Property, newStatus: PropertyStatus) => {
    if (newStatus === p.status) return;
    // Sold and Rented are reached by filing the transaction, not by editing a
    // field. The transaction service flips the property status in the same
    // database transaction, so opening the dialog here is the whole flow: a
    // status-only update would be rejected and would leave the deal unattributed.
    if (newStatus === 'Sold' || newStatus === 'Rented') {
      setTransactionProperty(p);
      setTransactionOutcome(newStatus);
      return;
    }
    try {
      await changeStatus.mutateAsync({ id: p.id, status: newStatus });
      notify({ type: 'success', title: 'Status updated', description: `"${p.title}" is now ${propertyStatusLabel(newStatus)}.` });
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

  // A removed agent cannot be given new work: they are off the roster and hidden
  // from the public directory, so a listing assigned to them would have no
  // reachable agent. Unverified and suspended agents stay, because the admin may
  // still be mid-way through verifying or reinstating them.
  const agents = (agentsQuery.data?.items ?? []).filter((a) => !a.isRemoved);
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
          <div className="overflow-x-auto">
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
                      {p.status === 'Sold' || p.status === 'Rented' ? (
                        // Sold and Rented are committed states: a sale is final and a
                        // tenancy is held by the live lease. Neither is changed from
                        // this dropdown, so it is shown as a locked badge. A rented
                        // property is freed by ending the tenancy on the Tenants page.
                        <span
                          title={
                            p.status === 'Sold'
                              ? 'Sold is final and cannot be changed here.'
                              : 'Tenanted. End the tenancy on the Tenants page to free this property.'
                          }
                          className={cn(
                            'inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-ink-200 bg-ink-50 px-2 py-1 text-xs font-medium',
                            `text-${statusTone[p.status] ?? 'neutral'}-700`,
                          )}
                        >
                          {propertyStatusLabel(p.status)}
                          <Lock className="h-3 w-3" />
                        </span>
                      ) : (
                        <select
                          value={p.status}
                          onChange={(e) => handleStatusChange(p, e.target.value as PropertyStatus)}
                          className={cn(
                            'rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs font-medium transition-colors hover:border-ink-300 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40',
                            `text-${statusTone[p.status] ?? 'neutral'}-700`,
                          )}
                        >
                          {propertyStatusesForListingType(p.listingType).map((s) => (
                            <option key={s} value={s}>{propertyStatusLabel(s)}</option>
                          ))}
                          {/* Keep a status that contradicts the listing type
                              selectable so it can be corrected rather than
                              silently vanishing from its own dropdown. */}
                          {!isStatusValidForListingType(p.status, p.listingType) && (
                            <option value={p.status}>{propertyStatusLabel(p.status)}</option>
                          )}
                        </select>
                      )}
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
                      <div className="flex items-center justify-end gap-1">
                        {/* An explicit way in. Relying on the status dropdown to open
                            the dialog meant there was no visible control anywhere
                            for recording a deal. */}
                        {p.status !== 'Sold' && p.status !== 'Rented' && (
                          <button
                            type="button"
                            title={
                              p.listingType === 'ForLease'
                                ? 'Record a rental for this property'
                                : 'Record a sale for this property'
                            }
                            onClick={() => {
                              setTransactionProperty(p);
                              setTransactionOutcome(p.listingType === 'ForLease' ? 'Rented' : 'Sold');
                            }}
                            className="rounded-lg border border-ink-200 px-2 py-1 text-xs font-medium text-ink-600 transition-colors hover:border-forest-500 hover:text-forest-600"
                          >
                            {p.listingType === 'ForLease' ? 'Record rental' : 'Record sale'}
                          </button>
                        )}
                        <RowActions
                          viewUrl={`/properties/${p.slug}`}
                          onEdit={() => { setEditing(p); setFormOpen(true); }}
                          onDelete={() => setDeleting(p)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <SectionFooter pageNumber={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
      </CardTable>

      <PropertyForm
        open={formOpen}
        property={editing}
        agents={agents}
        onClose={closeForm}
        onRequestTransaction={(p, outcome) => {
          setTransactionProperty(p);
          setTransactionOutcome(outcome);
        }}
      />

      <RecordTransactionDialog
        property={transactionProperty}
        outcome={transactionOutcome}
        onClose={() => {
          setTransactionProperty(null);
          setTransactionOutcome(null);
        }}
      />

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
