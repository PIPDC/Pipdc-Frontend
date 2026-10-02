import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { extractApiError } from '../../services/api';
import { useEscalateConversation } from '../../hooks/useConversationEscalation';
import type { Conversation } from '../../types';

const MIN_REASON_LENGTH = 10;

interface EscalateConversationDialogProps {
  conversation: Conversation | null;
  onClose: () => void;
}

/**
 * Batch 6. The handling agent hands a conversation to PIPDC.
 *
 * The reason is not decoration: it is the first thing an administrator reads when
 * deciding whether to claim the case, so it is required and the minimum length is
 * enforced here as well as on the server. The client cannot choose who receives it.
 */
export function EscalateConversationDialog({ conversation, onClose }: EscalateConversationDialogProps) {
  const [reason, setReason] = useState('');
  const { notify } = useToast();
  const escalate = useEscalateConversation();

  const close = () => {
    setReason('');
    onClose();
  };

  const handleEscalate = async () => {
    if (!conversation) return;

    const trimmed = reason.trim();
    if (trimmed.length < MIN_REASON_LENGTH) {
      notify({
        type: 'error',
        title: 'Please explain why',
        description: `Give the administrator at least ${MIN_REASON_LENGTH} characters of context.`,
      });
      return;
    }

    try {
      await escalate.mutateAsync({ id: conversation.id, reason: trimmed });
      notify({
        type: 'success',
        title: 'Escalated to PIPDC',
        description: 'An administrator has been notified and will take over this conversation.',
      });
      close();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Could not escalate',
        description: extractApiError(error),
      });
    }
  };

  return (
    <Modal
      open={Boolean(conversation)}
      onClose={close}
      title="Escalate to PIPDC"
      description="PIPDC takes over this conversation. The client is told, and you can no longer reply."
      size="md"
    >
      <div className="space-y-4">
        {conversation && (
          <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
            <p className="text-sm font-medium text-ink-900">{conversation.property.title}</p>
            <p className="mt-0.5 text-xs text-ink-500">
              {conversation.client.fullName} · {conversation.messageCount} message
              {conversation.messageCount === 1 ? '' : 's'} so far
            </p>
          </div>
        )}

        <p className="flex items-start gap-2 rounded-xl border border-gold-200 bg-gold-50 p-3 text-xs text-gold-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Once escalated, the client is told PIPDC has taken over and you become read-only on this thread. The
            full history stays in place, so nothing is lost.
          </span>
        </p>

        <Textarea
          label="Why does this need PIPDC? *"
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. The buyer is asking about the title documents and I cannot verify them."
          hint={`${reason.trim().length}/${MIN_REASON_LENGTH} minimum characters`}
          disabled={escalate.isPending}
        />

        <div className="flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={close} disabled={escalate.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={escalate.isPending}
            disabled={reason.trim().length < MIN_REASON_LENGTH}
            onClick={handleEscalate}
          >
            Escalate to PIPDC
          </Button>
        </div>
      </div>
    </Modal>
  );
}
