import { Radar } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { useDevelopmentTracking } from '../../../hooks/queries';
import { useStopDevelopmentTracking } from '../../../hooks/mutations';
import { useToast } from '../../ui/Toast';
import { extractApiError } from '../../../services/api';
import { timeAgo } from '../../../utils/format';
import { trackingStatusTone, trackingStatusLabel } from '../../../utils/developmentStatus';
import { CardTable, LoadingRows, TableEmpty, thClass, tdClass } from './shared';

export function TrackedDevelopmentsSection() {
  const { notify } = useToast();
  const trackingQuery = useDevelopmentTracking();
  const stopTracking = useStopDevelopmentTracking();

  const items = trackingQuery.data?.items ?? [];

  const handleStopTracking = async (projectId: number, name: string) => {
    try {
      await stopTracking.mutateAsync(projectId);
      notify({ type: 'success', title: 'Tracking stopped', description: `You are no longer tracking "${name}".` });
    } catch (err) {
      notify({ type: 'error', title: 'Could not stop tracking', description: extractApiError(err) });
    }
  };

  return (
    <CardTable title="Tracked Projects">
      {trackingQuery.isLoading ? (
        <LoadingRows rows={4} />
      ) : items.length === 0 ? (
        <TableEmpty />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60">
                <th className={thClass}>Project</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Tracked</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {items.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-ink-50/60">
                  <td className={tdClass}>
                    <span className="font-medium text-ink-900">{t.developmentProjectName}</span>
                    {t.developmentUnitIdentifier && (
                      <span className="block text-xs text-ink-400">{t.developmentUnitIdentifier}</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    <Badge tone={trackingStatusTone(t.status)}>{trackingStatusLabel(t.status)}</Badge>
                  </td>
                  <td className={tdClass}>{timeAgo(t.trackedAt)}</td>
                  <td className={tdClass}>
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/developments/${t.developmentProjectId}`}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-forest-600 transition-colors hover:bg-forest-50"
                      >
                        View Project
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStopTracking(t.developmentProjectId, t.developmentProjectName)}
                        leftIcon={<Radar className="h-3.5 w-3.5" />}
                        className="text-ink-500"
                      >
                        Untrack
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardTable>
  );
}
