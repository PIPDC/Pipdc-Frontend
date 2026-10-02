import { useState } from 'react';
import { Ban, Eye, Scale, ShieldCheck, ShieldX, Unlock } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { Textarea } from '../../ui/Input';
import { useToast } from '../../ui/Toast';
import { extractApiError } from '../../../services/api';
import { formatDate } from '../../../utils/format';
import {
  useAgentAppealsForReview,
  useAgentApplicationBlocks,
  useDecideAgentAppeal,
  useLiftAgentApplicationBlock,
  useStartAppealReview,
} from '../../../hooks/useAgentApplications';
import type { AgentAppealReview, AgentAppealStatus } from '../../../services/agentApplicationService';
import { CardTable, LoadingRows, TableEmpty, thClass, tdClass, SectionFooter } from './shared';

const PAGE_SIZE = 10;

const FILTERS: { label: string; value: AgentAppealStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Submitted', value: 'Submitted' },
  { label: 'Under review', value: 'UnderReview' },
  { label: 'Upheld', value: 'Upheld' },
  { label: 'Refused', value: 'Refused' },
];

const appealTone: Record<AgentAppealStatus, 'warning' | 'info' | 'success' | 'danger'> = {
  Submitted: 'warning',
  UnderReview: 'info',
  Upheld: 'success',
  Refused: 'danger',
};

const MIN_NOTE_LENGTH = 10;

/**
 * The admin counterpart to the applicant appeal view.
 *
 * Two queues rather than one, because they answer different questions: an appeal
 * contests a decision that has already been made, whereas a bar is a standing
 * state an applicant is currently held in. Upholding an appeal reinstates the
 * agent; lifting a bar only restores the right to apply.
 */
export function AppealsSection() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AgentAppealStatus | undefined>(undefined);
  const [viewing, setViewing] = useState<AgentAppealReview | null>(null);
  const [deciding, setDeciding] = useState<{ appeal: AgentAppealReview; decision: 'Upheld' | 'Refused' } | null>(null);
  const [note, setNote] = useState('');
  const [lifting, setLifting] = useState<string | null>(null);

  const { notify } = useToast();
  const appealsQuery = useAgentAppealsForReview({ page, pageSize: PAGE_SIZE, status });
  const blocksQuery = useAgentApplicationBlocks();
  const startReview = useStartAppealReview();
  const decide = useDecideAgentAppeal();
  const liftBlock = useLiftAgentApplicationBlock();

  const appeals = appealsQuery.data?.items ?? [];
  const totalCount = appealsQuery.data?.totalCount ?? 0;
  const blocks = blocksQuery.data ?? [];
  const activeBlocks = blocks.filter((b) => !b.liftedAt);

  const isPending = startReview.isPending || decide.isPending || liftBlock.isPending;

  const handleStartReview = async (appeal: AgentAppealReview) => {
    try {
      await startReview.mutateAsync(appeal.id);
      notify({ type: 'success', title: 'Appeal claimed', description: 'It is now marked as under review.' });
    } catch (err) {
      notify({ type: 'error', title: 'Could not claim appeal', description: extractApiError(err) });
    }
  };

  const handleDecide = async () => {
    if (!deciding) return;
    if (note.trim().length < MIN_NOTE_LENGTH) {
      notify({
        type: 'error',
        title: 'Decision note required',
        description: 'The agent is emailed this, so say what was decided and why.',
      });
      return;
    }
    try {
      await decide.mutateAsync({ id: deciding.appeal.id, decision: deciding.decision, note: note.trim() });
      notify({
        type: 'success',
        title: deciding.decision === 'Upheld' ? 'Appeal upheld' : 'Appeal refused',
        description:
          deciding.decision === 'Upheld'
            ? 'The registration and the agent role have been restored, and the agent has been emailed.'
            : 'The registration stays revoked. The agent has been emailed whether they may reapply.',
      });
      setDeciding(null);
      setNote('');
    } catch (err) {
      notify({ type: 'error', title: 'Could not record the decision', description: extractApiError(err) });
    }
  };

  const handleLift = async () => {
    if (!lifting) return;
    const block = blocks.find((b) => b.userId === lifting);
    try {
      await liftBlock.mutateAsync(lifting);
      notify({
        type: 'success',
        title: 'Bar lifted',
        description: `${block?.fullName ?? 'The applicant'} can apply as an agent again, and has been emailed.`,
      });
      setLifting(null);
    } catch (err) {
      notify({ type: 'error', title: 'Could not lift the bar', description: extractApiError(err) });
    }
  };

  const openDecision = (appeal: AgentAppealReview, decision: 'Upheld' | 'Refused') => {
    setDeciding({ appeal, decision });
    setNote('');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-500">
          Appeals against revoked agent registrations. Upholding one reinstates the agent and restores their role.
        </p>
      </div>
      <CardTable
        title="Registration appeals"
        actions={
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => {
                  setStatus(f.value);
                  setPage(1);
                }}
                className={
                  status === f.value
                    ? 'rounded-lg bg-forest-600 px-3 py-1.5 text-xs font-semibold text-white'
                    : 'rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:border-forest-300 hover:text-forest-700'
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      >
        {appealsQuery.isLoading ? (
          <LoadingRows rows={5} />
        ) : appeals.length === 0 ? (
          <TableEmpty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-ink-100">
                <tr>
                  <th className={thClass}>Appellant</th>
                  <th className={thClass}>Lodged</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {appeals.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-ink-50">
                    <td className={tdClass}>
                      <p className="font-medium text-ink-900">{a.appellantName}</p>
                      <p className="text-xs text-ink-400">{a.appellantEmail}</p>
                    </td>
                    <td className={tdClass}>{formatDate(a.createdAt)}</td>
                    <td className={tdClass}>
                      <Badge tone={appealTone[a.status]}>{a.status}</Badge>
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title="View details"
                          onClick={() => setViewing(a)}
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-forest-50 hover:text-forest-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {a.status === 'Submitted' && (
                          <button
                            type="button"
                            title="Claim for review"
                            disabled={isPending}
                            onClick={() => handleStartReview(a)}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-ink-500 transition-colors hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                          >
                            Start review
                          </button>
                        )}
                        {(a.status === 'Submitted' || a.status === 'UnderReview') && (
                          <>
                            <button
                              type="button"
                              title="Uphold: reinstate the agent"
                              disabled={isPending}
                              onClick={() => openDecision(a, 'Upheld')}
                              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Refuse: the revocation stands"
                              disabled={isPending}
                              onClick={() => openDecision(a, 'Refused')}
                              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              <ShieldX className="h-4 w-4" />
                            </button>
                          </>
                        )}
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

      {/* The bar list is separate from the appeal queue: lifting a bar does not
          reinstate an agent, it only lets them apply again. */}
      <CardTable title="Accounts barred from applying">
        {blocksQuery.isLoading ? (
          <LoadingRows rows={3} />
        ) : activeBlocks.length === 0 ? (
          <TableEmpty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-ink-100">
                <tr>
                  <th className={thClass}>Account</th>
                  <th className={thClass}>Reason</th>
                  <th className={thClass}>Barred</th>
                  <th className={thClass}>By</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {activeBlocks.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-ink-50">
                    <td className={tdClass}>
                      <p className="font-medium text-ink-900">{b.fullName}</p>
                      <p className="text-xs text-ink-400">{b.email}</p>
                    </td>
                    <td className={`${tdClass} max-w-xs`}>
                      <span className="line-clamp-2 text-sm text-ink-600">{b.reason}</span>
                    </td>
                    <td className={tdClass}>{formatDate(b.createdAt)}</td>
                    <td className={tdClass}>
                      <span className="text-xs text-ink-400">{b.blockedByAdminId}</span>
                    </td>
                    <td className={tdClass}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setLifting(b.userId)}
                        leftIcon={<Unlock className="h-4 w-4" />}
                      >
                        Lift bar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardTable>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="Appeal details" size="md">
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-semibold text-ink-900">{viewing.appellantName}</span>
              <Badge tone={appealTone[viewing.status]}>{viewing.status}</Badge>
            </div>

            <dl className="divide-y divide-ink-100 rounded-lg border border-ink-100 px-4 py-2 text-sm">
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-ink-500">Email</dt>
                <dd className="text-right font-medium text-ink-900">{viewing.appellantEmail}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-ink-500">Lodged</dt>
                <dd className="text-right font-medium text-ink-900">{formatDate(viewing.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-ink-500">Decided</dt>
                <dd className="text-right font-medium text-ink-900">
                  {viewing.reviewedAt ? formatDate(viewing.reviewedAt) : 'Not yet'}
                </dd>
              </div>
            </dl>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">The appeal</p>
              <p className="mt-1 whitespace-pre-wrap rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">
                {viewing.reason}
              </p>
            </div>

            {viewing.decisionNote && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Decision note</p>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">
                  {viewing.decisionNote}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
              <Button variant="ghost" onClick={() => setViewing(null)}>
                Close
              </Button>
              {(viewing.status === 'Submitted' || viewing.status === 'UnderReview') && (
                <>
                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={() => {
                      openDecision(viewing, 'Refused');
                      setViewing(null);
                    }}
                  >
                    Refuse
                  </Button>
                  <Button
                    variant="primary"
                    disabled={isPending}
                    onClick={() => {
                      openDecision(viewing, 'Upheld');
                      setViewing(null);
                    }}
                  >
                    Uphold and reinstate
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deciding)}
        onClose={() => setDeciding(null)}
        title={deciding?.decision === 'Upheld' ? 'Uphold the appeal' : 'Refuse the appeal'}
        size="md"
      >
        {deciding && (
          <div className="space-y-4">
            <div
              className={`flex items-start gap-3 rounded-lg px-4 py-3 ${
                deciding.decision === 'Upheld' ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              {deciding.decision === 'Upheld' ? (
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              ) : (
                <ShieldX className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              )}
              <p className={`text-sm ${deciding.decision === 'Upheld' ? 'text-green-800' : 'text-red-800'}`}>
                {deciding.decision === 'Upheld' ? (
                  <>
                    <span className="font-medium">{deciding.appeal.appellantName}</span>&apos;s registration is
                    restored, their agent access is returned, and their application goes back to approved. Their
                    properties and open enquiries stay with whoever they were handed to.
                  </>
                ) : (
                  <>
                    <span className="font-medium">{deciding.appeal.appellantName}</span>&apos;s revocation stands.
                    They lose agent access, and they are told whether they may submit a fresh application.
                  </>
                )}
              </p>
            </div>
            <Textarea
              label="Decision note *"
              rows={4}
              placeholder="Explain what you decided and why. This is emailed to the agent."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              hint={`${note.trim().length}/2000 characters. At least 10 are required.`}
            />
            <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
              <Button variant="ghost" onClick={() => setDeciding(null)}>
                Cancel
              </Button>
              <Button
                variant={deciding.decision === 'Upheld' ? 'primary' : 'danger'}
                loading={decide.isPending}
                onClick={handleDecide}
                disabled={note.trim().length < MIN_NOTE_LENGTH}
              >
                {deciding.decision === 'Upheld' ? 'Uphold and reinstate' : 'Refuse appeal'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmLiftBlock
        open={Boolean(lifting)}
        userName={blocks.find((b) => b.userId === lifting)?.fullName ?? 'this applicant'}
        loading={liftBlock.isPending}
        onConfirm={() => void handleLift()}
        onCancel={() => setLifting(null)}
      />
    </div>
  );
}

/**
 * Lifting a bar is reversible only by barring again, but it is still a standing
 * decision on someone's access, so it is confirmed rather than fired from the
 * table row.
 */
function ConfirmLiftBlock({
  open,
  userName,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  userName: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title="Lift the bar" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-ink-50 px-4 py-3">
          <Ban className="mt-0.5 h-5 w-5 shrink-0 text-ink-500" />
          <p className="text-sm text-ink-700">
            {userName} will be able to submit an agent application again, and will be emailed. This does not
            reinstate them as an agent; that requires an upheld appeal or a new application being approved.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" loading={loading} onClick={onConfirm} leftIcon={<Scale className="h-4 w-4" />}>
            Lift bar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
