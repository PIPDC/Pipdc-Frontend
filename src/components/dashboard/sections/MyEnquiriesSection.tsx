import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, ExternalLink, MessagesSquare } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { useMyEnquiries } from '../../../hooks/queries';
import { formatDate, timeAgo } from '../../../utils/format';
import { enquiryStatusLabel, enquiryStatusTone } from '../../../utils/enquiryStatus';
import { CardTable, LoadingRows, TableEmpty, thClass, tdClass } from './shared';
import type { Enquiry } from '../../../types';

export function MyEnquiriesSection() {
  const enquiriesQuery = useMyEnquiries();
  const navigate = useNavigate();
  const [viewing, setViewing] = useState<Enquiry | null>(null);

  const enquiries = enquiriesQuery.data?.items ?? [];

  return (
    <>
      <CardTable title="My Enquiries">
        {enquiriesQuery.isLoading ? (
          <LoadingRows rows={4} />
        ) : enquiries.length === 0 ? (
          <TableEmpty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60">
                  <th className={thClass}>Property</th>
                  <th className={thClass}>Message</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Sent</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {enquiries.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-ink-50/60">
                    <td className={tdClass}>
                      <Link to={`/properties/${e.propertySlug}`} className="font-medium text-forest-600 hover:text-forest-700">
                        {e.propertyTitle}
                      </Link>
                    </td>
                    <td className={tdClass}><span className="line-clamp-1 text-ink-600">{e.message}</span></td>
                    <td className={tdClass}><Badge tone={enquiryStatusTone(e.status)}>{enquiryStatusLabel(e.status)}</Badge></td>
                    <td className={tdClass}>{timeAgo(e.createdAt)}</td>
                    <td className={tdClass}>
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewing(e)}
                          title="View details"
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-forest-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/messages?enquiry=${e.id}`)}
                          title="Open conversation"
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-forest-600"
                        >
                          <MessagesSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardTable>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="Enquiry details" size="md">
        {viewing && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Property</p>
              <p className="mt-1 text-ink-800">{viewing.propertyTitle}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Message</p>
              <p className="mt-1 whitespace-pre-wrap text-ink-700">{viewing.message}</p>
            </div>
            <div className="flex items-center justify-between border-t border-ink-100 pt-3 text-xs text-ink-400">
              <span>Sent {formatDate(viewing.createdAt)}</span>
              <Badge tone={enquiryStatusTone(viewing.status)}>{enquiryStatusLabel(viewing.status)}</Badge>
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
    </>
  );
}
