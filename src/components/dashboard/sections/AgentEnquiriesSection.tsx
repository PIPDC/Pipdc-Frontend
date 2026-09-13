import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, ExternalLink, MessagesSquare, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { useUpdateEnquiry, useDeleteEnquiry } from '../../../hooks/mutations';
import { useEnquiries } from '../../../hooks/queries';
import { enquiryService } from '../../../services/enquiryService';
import { formatDate, timeAgo } from '../../../utils/format';
import { extractApiError, isConcurrencyConflict, CONCURRENCY_CONFLICT_DESCRIPTION } from '../../../services/api';
import { useToast } from '../../ui/Toast';
import { cn } from '../../../utils/cn';
import { ENQUIRY_STATUS_OPTIONS, enquiryStatusLabel, enquiryStatusTone } from '../../../utils/enquiryStatus';
import { CardTable, RowActions, LoadingRows, TableEmpty, thClass, tdClass, SectionFooter } from './shared';
import type { Enquiry, EnquiryStatus } from '../../../types';

const PAGE_SIZE = 10;

export function AgentEnquiriesSection({ title }: { title: string }) {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const enquiriesQuery = useEnquiries({ pageNumber: page, pageSize: PAGE_SIZE, keyword: keyword || undefined });
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const navigate = useNavigate();
  const updateEnquiry = useUpdateEnquiry();
  const deleteEnquiry = useDeleteEnquiry();

  const [draftStatus, setDraftStatus] = useState<Record<number, EnquiryStatus>>({});
  const [viewing, setViewing] = useState<Enquiry | null>(null);
  const [deleting, setDeleting] = useState<Enquiry | null>(null);

  const enquiries = enquiriesQuery.data?.items ?? [];
  const totalCount = enquiriesQuery.data?.totalCount ?? 0;

  const openEnquiry = async (e: Enquiry) => {
    setViewing(e);
    try {
      const fresh = await enquiryService.getById(e.id);
      setViewing(fresh);
      if (!e.isRead) {
        void queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      }
    } catch (err) {
      notify({ type: 'error', title: 'Could not open enquiry', description: extractApiError(err) });
    }
  };

  const saveStatus = async (e: Enquiry) => {
    const status = draftStatus[e.id];
    if (!status || status === e.status) return;
    try {
      await updateEnquiry.mutateAsync({
        id: e.id,
        payload: { fullName: e.fullName, email: e.email, phone: e.phone, message: e.message, status },
      });
      notify({ type: 'success', title: 'Status updated', description: `${e.fullName}'s enquiry is now ${enquiryStatusLabel(status)}.` });
    } catch (err) {
      notify({
        type: 'error',
        title: isConcurrencyConflict(err) ? 'This enquiry just changed' : 'Could not update status',
        description: isConcurrencyConflict(err) ? CONCURRENCY_CONFLICT_DESCRIPTION : extractApiError(err),
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteEnquiry.mutateAsync(deleting.id);
      notify({ type: 'success', title: 'Enquiry deleted', description: `Enquiry from ${deleting.fullName} was removed.` });
      setDeleting(null);
    } catch (err) {
      notify({ type: 'error', title: 'Could not delete enquiry', description: extractApiError(err) });
    }
  };

  return (
    <>
      <CardTable title={title}>
        <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search enquiries..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setKeyword(searchInput); } }}
              className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm text-ink-700 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
            />
          </div>
        </div>
        {enquiriesQuery.isLoading ? (
          <LoadingRows rows={5} />
        ) : enquiries.length === 0 ? (
          <TableEmpty />
        ) : (
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60">
                <th className={thClass}>Client</th>
                <th className={thClass}>Phone</th>
                <th className={thClass}>Message</th>
                <th className={thClass}>Property</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Date</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {enquiries.map((e) => {
                const draft = draftStatus[e.id];
                return (
                  <tr key={e.id} className={cn('transition-colors hover:bg-ink-50/60', !e.isRead && 'bg-gold-50/40')}>
                    <td className={tdClass}>
                      <span className="flex items-center gap-2 font-medium text-ink-900">
                        {e.fullName}
                        {!e.isRead && <Badge tone="danger">New</Badge>}
                      </span>
                      <span className="block text-xs text-ink-400">{e.email}</span>
                    </td>
                    <td className={tdClass}>
                      <span className="text-ink-600">{e.phone || <span className="italic text-ink-400">Not provided</span>}</span>
                    </td>
                    <td className={tdClass}>
                      <span className="line-clamp-1 max-w-[220px] text-ink-600">{e.message}</span>
                    </td>
                    <td className={tdClass}>
                      <Link to={`/properties/${e.propertySlug}`} className="font-medium text-forest-600 hover:text-forest-700">
                        {e.propertyTitle}
                      </Link>
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-2">
                        <select
                          value={draft ?? e.status}
                          onChange={(ev) => setDraftStatus((prev) => ({ ...prev, [e.id]: ev.target.value as EnquiryStatus }))}
                          className="h-9 rounded-lg border border-ink-200 bg-white px-2 text-sm text-ink-700 focus:border-forest-500 focus:outline-none"
                        >
                          {ENQUIRY_STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{enquiryStatusLabel(s)}</option>
                          ))}
                        </select>
                        {draft && draft !== e.status && (
                          <Button variant="primary" size="sm" loading={updateEnquiry.isPending} onClick={() => saveStatus(e)}>
                            Save
                          </Button>
                        )}
                        {!draft && <Badge tone={enquiryStatusTone(e.status)}>{enquiryStatusLabel(e.status)}</Badge>}
                      </div>
                    </td>
                    <td className={tdClass}>{timeAgo(e.createdAt)}</td>
                    <td className={tdClass}>
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEnquiry(e)}
                          title="View details"
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-forest-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/properties/${e.propertySlug}`}
                          title="View property"
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-forest-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/messages?enquiry=${e.id}`)}
                          title="Open conversation"
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-forest-600"
                        >
                          <MessagesSquare className="h-4 w-4" />
                        </button>
                        <RowActions onDelete={() => setDeleting(e)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <SectionFooter pageNumber={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
      </CardTable>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="Enquiry details" size="md">
        {viewing && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Client</p>
                <p className="mt-1 font-medium text-ink-900">{viewing.fullName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Contact</p>
                <p className="mt-1 text-ink-800">{viewing.email}</p>
                <p className="text-ink-500">{viewing.phone || 'No phone provided'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Property</p>
              <p className="mt-1 text-ink-800">{viewing.propertyTitle}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Message</p>
              <p className="mt-1 whitespace-pre-wrap text-ink-700">{viewing.message}</p>
            </div>
            <div className="flex items-center justify-between border-t border-ink-100 pt-3 text-xs text-ink-400">
              <span>Submitted {formatDate(viewing.createdAt)}</span>
              <span className="flex items-center gap-2">
                {viewing.isRead ? (
                  <span>Read {viewing.agentReadAt ? `· ${formatDate(viewing.agentReadAt)}` : ''}</span>
                ) : (
                  <Badge tone="danger">Unread</Badge>
                )}
                <Badge tone={enquiryStatusTone(viewing.status)}>{enquiryStatusLabel(viewing.status)}</Badge>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/properties/${viewing.propertySlug}`} className="inline-flex">
                <Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />}>
                  View Property
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<MessagesSquare className="h-4 w-4" />}
                onClick={() => navigate(`/dashboard/messages?enquiry=${viewing.id}`)}
              >
                Open Conversation
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete enquiry"
        description={`Are you sure you want to delete the enquiry from ${deleting?.fullName}? This cannot be undone.`}
        confirmLabel="Delete enquiry"
        loading={deleteEnquiry.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
