import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessagesSquare } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { useSavedProperties } from '../../../hooks/queries';
import { useAuth } from '../../../contexts/AuthContext';
import { useFavourites } from '../../../hooks/useFavourites';
import { conversationService } from '../../../services/conversationService';
import { extractApiError } from '../../../services/api';
import { formatPrice, timeAgo } from '../../../utils/format';
import { propertyStatusLabel } from '../../../utils/propertyStatus';
import { useToast } from '../../ui/Toast';
import { CardTable, RowActions, LoadingRows, TableEmpty, thClass, tdClass, SectionFooter } from './shared';

const PAGE_SIZE = 10;

const statusTone: Record<string, 'forest' | 'gold' | 'neutral' | 'info' | 'danger'> = {
  Available: 'forest',
  Pending: 'gold',
  Sold: 'neutral',
  Rented: 'info',
  Unavailable: 'danger',
};

export function SavedSection() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const savedQuery = useSavedProperties({ pageNumber: page, pageSize: PAGE_SIZE });
  const { isAuthenticated } = useAuth();
  const { toggle } = useFavourites();
  const { notify } = useToast();
  const [enquiringId, setEnquiringId] = useState<number | null>(null);

  const items = savedQuery.data?.items ?? [];
  const totalCount = savedQuery.data?.totalCount ?? 0;

  const handleEnquire = async (propertyId: number) => {
    setEnquiringId(propertyId);
    try {
      const enquiry = await conversationService.resolveEnquiryForProperty(propertyId, crypto.randomUUID());
      navigate(`/dashboard/messages?enquiry=${enquiry.id}`);
    } catch (err) {
      notify({ type: 'error', title: 'Could not start conversation', description: extractApiError(err) });
    } finally {
      setEnquiringId(null);
    }
  };

  return (
    <CardTable title="Saved Properties">
      {!isAuthenticated ? (
        <TableEmpty />
      ) : savedQuery.isLoading ? (
        <LoadingRows rows={4} />
      ) : items.length === 0 ? (
        <TableEmpty />
      ) : (
        <table className="w-full min-w-[780px] border-collapse">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60">
              <th className={thClass}>Property</th>
              <th className={thClass}>Price</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Saved</th>
              <th className={thClass}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {items.map((sp) => (
              <tr key={sp.property.id} className="transition-colors hover:bg-ink-50/60">
                <td className={tdClass}>
                  <span className="font-medium text-ink-900">{sp.property.title}</span>
                  <span className="block text-xs text-ink-400">{sp.property.address}, {sp.property.city}</span>
                </td>
                <td className={tdClass}>{formatPrice(sp.property.price, sp.property.currency)}</td>
                <td className={tdClass}><Badge tone={statusTone[sp.property.status] ?? 'neutral'}>{propertyStatusLabel(sp.property.status)}</Badge></td>
                <td className={tdClass}>{timeAgo(sp.savedAt)}</td>
                <td className={tdClass}>
                  <div className="flex items-center justify-end gap-1.5">
                    <RowActions viewUrl={`/properties/${sp.property.slug}`} />
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={enquiringId === sp.property.id}
                      onClick={() => handleEnquire(sp.property.id)}
                      leftIcon={<MessagesSquare className="h-3.5 w-3.5" />}
                    >
                      Enquire
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggle(sp.property.id)}
                      leftIcon={<Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />}
                      className="text-red-600"
                    >
                      Unsave
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <SectionFooter pageNumber={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
    </CardTable>
  );
}
