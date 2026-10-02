import { useState } from 'react';
import { Eye, ShieldCheck, ShieldOff, Search } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { useDeactivateUser, useActivateUser } from '../../../hooks/mutations';
import { useUsers, useUser } from '../../../hooks/queries';
import { useAuth } from '../../../contexts/AuthContext';
import { formatDate } from '../../../utils/format';
import { extractApiError } from '../../../services/api';
import { useToast } from '../../ui/Toast';
import { CardTable, LoadingRows, TableEmpty, thClass, tdClass, SectionFooter } from './shared';
import type { User } from '../../../types';

const PAGE_SIZE = 10;

export function UsersSection() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const usersQuery = useUsers({ pageNumber: page, pageSize: PAGE_SIZE, keyword: keyword || undefined });
  const { user: currentUser } = useAuth();
  const { notify } = useToast();
  const deactivateUser = useDeactivateUser();
  const activateUser = useActivateUser();

  const [viewing, setViewing] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState<User | null>(null);
  const [activating, setActivating] = useState<User | null>(null);

  const detailQuery = useUser(viewing?.id);

  const users = usersQuery.data?.items ?? [];
  const totalCount = usersQuery.data?.totalCount ?? 0;

  const confirmDeactivate = async () => {
    if (!deactivating) return;
    try {
      await deactivateUser.mutateAsync(deactivating.id);
      notify({ type: 'success', title: 'User deactivated', description: `${deactivating.fullName} has been deactivated.` });
      setDeactivating(null);
    } catch (err) {
      notify({ type: 'error', title: 'Could not deactivate user', description: extractApiError(err) });
    }
  };

  const confirmActivate = async () => {
    if (!activating) return;
    try {
      await activateUser.mutateAsync(activating.id);
      notify({ type: 'success', title: 'User activated', description: `${activating.fullName} has been activated.` });
      setActivating(null);
    } catch (err) {
      notify({ type: 'error', title: 'Could not activate user', description: extractApiError(err) });
    }
  };

  const isSelf = (u: User) => currentUser?.id === u.id;

  return (
    <>
      <CardTable title="Registered Users">
        <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setKeyword(searchInput); } }}
              className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm text-ink-700 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
            />
          </div>
        </div>
        {usersQuery.isLoading ? (
          <LoadingRows rows={5} />
        ) : users.length === 0 ? (
          <TableEmpty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60">
                  <th className={thClass}>User</th>
                  <th className={thClass}>Roles</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Joined</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {users.map((u) => {
                  const isAgent = u.roles.includes('Agent');
                  const isAdmin = u.roles.includes('Admin');
                  return (
                    <tr key={u.id} className="transition-colors hover:bg-ink-50/60">
                      <td className={tdClass}>
                        <span className="font-medium text-ink-900">{u.fullName}{isSelf(u) && <span className="ml-1.5 text-xs text-ink-400">(you)</span>}</span>
                        <span className="block text-xs text-ink-400">{u.email}</span>
                      </td>
                      <td className={tdClass}>
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles.map((r) => (
                            <Badge key={r} tone={r === 'Admin' ? 'forest' : r === 'Agent' ? 'gold' : 'neutral'}>{r}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className={tdClass}><Badge tone={u.status === 'Active' ? 'forest' : 'neutral'}>{u.status}</Badge></td>
                      <td className={tdClass}>{formatDate(u.createdAt)}</td>
                      <td className={tdClass}>
                        <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                          <button
                            type="button"
                            title="View profile"
                            onClick={() => setViewing(u)}
                            className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-forest-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {!isAdmin && !isAgent && !isSelf(u) && u.status === 'Active' && (
                            <button
                              type="button"
                              title="Deactivate user"
                              onClick={() => setDeactivating(u)}
                              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <ShieldOff className="h-4 w-4" />
                            </button>
                          )}
                          {!isAdmin && !isSelf(u) && u.status === 'Suspended' && (
                            <button
                              type="button"
                              title="Activate user"
                              onClick={() => setActivating(u)}
                              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-forest-50 hover:text-forest-600"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <SectionFooter pageNumber={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
      </CardTable>

      {/* View Profile Modal */}
      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="User Profile" size="md">
        {detailQuery.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-ink-100" />
            ))}
          </div>
        ) : detailQuery.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Full Name</p>
                <p className="mt-1 text-sm text-ink-900">{detailQuery.data.fullName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Email</p>
                <p className="mt-1 text-sm text-ink-900">{detailQuery.data.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Phone</p>
                <p className="mt-1 text-sm text-ink-900">{detailQuery.data.phoneNumber || 'â€”'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Joined</p>
                <p className="mt-1 text-sm text-ink-900">{formatDate(detailQuery.data.createdAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Roles</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {detailQuery.data.roles.map((r) => (
                  <Badge key={r} tone={r === 'Admin' ? 'forest' : r === 'Agent' ? 'gold' : 'neutral'}>{r}</Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-ink-50 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Account Status</p>
                <p className="mt-0.5 text-sm font-medium text-ink-900">{detailQuery.data.status}</p>
              </div>
              <Badge tone={detailQuery.data.status === 'Active' ? 'forest' : 'neutral'}>
                {detailQuery.data.status}
              </Badge>
            </div>
            {detailQuery.data.agentId && (
              <div className="rounded-lg bg-gold-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">Agent Profile</p>
                <div className="mt-1.5 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-gold-600">Agency:</span>{' '}
                    <span className="text-gold-800">{detailQuery.data.agentAgencyName || 'â€”'}</span>
                  </div>
                  <div>
                    <span className="text-gold-600">License:</span>{' '}
                    <span className="text-gold-800">{detailQuery.data.agentLicenseNumber || 'â€”'}</span>
                  </div>
                  <div>
                    <span className="text-gold-600">Verified:</span>{' '}
                    <Badge tone={detailQuery.data.agentIsVerified ? 'forest' : 'neutral'}>
                      {detailQuery.data.agentIsVerified ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deactivating)}
        title="Deactivate user"
        description={`Are you sure you want to deactivate ${deactivating?.fullName}? They will be unable to sign in until reactivated.`}
        confirmLabel="Deactivate"
        loading={deactivateUser.isPending}
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivating(null)}
      />

      <ConfirmDialog
        open={Boolean(activating)}
        title="Activate user"
        description={`Are you sure you want to activate ${activating?.fullName}? They will be able to sign in again.`}
        confirmLabel="Activate"
        tone="primary"
        loading={activateUser.isPending}
        onConfirm={confirmActivate}
        onCancel={() => setActivating(null)}
      />
    </>
  );
}
