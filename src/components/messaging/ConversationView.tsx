import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  ShieldCheck,
  Siren,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { extractApiError } from "../../services/api";
import { MessageList } from "./MessageList";
import { MessageComposer } from "./MessageComposer";
import { EscalationBanner } from "./EscalationBanner";
import { EscalateConversationDialog } from "./EscalateConversationDialog";
import { useMessages } from "../../hooks/queries";
import { useSendMessage } from "../../hooks/mutations";
import {
  useClaimConversation,
  useResolveConversation,
} from "../../hooks/useConversationEscalation";
import type { Conversation } from "../../types";

interface ConversationViewProps {
  conversation: Conversation;
  currentUserId: string;
  canSend: boolean;
  /** Batch 6. Admins act on escalated cases; only an agent can raise one. */
  isAdmin: boolean;
  isAssignedAgent: boolean;
  onBack?: () => void;
}

export function ConversationView({
  conversation,
  currentUserId,
  canSend,
  isAdmin,
  isAssignedAgent,
  onBack,
}: ConversationViewProps) {
  const messagesQuery = useMessages(conversation.id);
  const sendMessage = useSendMessage();
  const claim = useClaimConversation();
  const resolve = useResolveConversation();
  const { notify } = useToast();
  const [escalating, setEscalating] = useState(false);
  // One idempotency key per send intent: reused on failure/retry so a lost response
  // is replayed instead of delivering a duplicate message, and only rotated on success.
  const pendingKeyRef = useRef(crypto.randomUUID());

  const isClientViewer = conversation.client.userId === currentUserId;
  const otherName = isClientViewer
    ? conversation.agent.fullName
    : conversation.client.fullName;
  const otherMeta = isClientViewer
    ? conversation.agent.agencyName
    : conversation.client.email;

  const status = conversation.escalationStatus ?? "Active";
  // Only the handling agent can hand a live thread over, and only while it is
  // still theirs. Once PIPDC owns it the original agent is read-only.
  const canEscalate = isAssignedAgent && status === "Active";
  const canClaim = isAdmin && status === "Escalated";
  const ownsEscalation =
    isAdmin &&
    status === "Assigned" &&
    conversation.assignedAdminId === currentUserId;
  const canResolve = ownsEscalation;

  // An admin may only reply while they personally own the case, which is why this
  // no longer trusts the caller's `canSend` alone.
  const composerEnabled = (canSend && status !== "Assigned") || ownsEscalation;

  const handleSend = async (content: string) => {
    await sendMessage.mutateAsync({
      conversationId: conversation.id,
      content,
      idempotencyKey: pendingKeyRef.current,
    });
    pendingKeyRef.current = crypto.randomUUID();
  };

  const handleClaim = async () => {
    try {
      await claim.mutateAsync(conversation.id);
      notify({
        type: "success",
        title: "Case claimed",
        description:
          "You now own this conversation and can reply to the client.",
      });
    } catch (error) {
      notify({
        type: "error",
        title: "Could not claim",
        description: extractApiError(error),
      });
    }
  };

  const handleResolve = async () => {
    try {
      await resolve.mutateAsync(conversation.id);
      notify({
        type: "success",
        title: "Case resolved",
        description: "The conversation is closed. Its history is kept.",
      });
    } catch (error) {
      notify({
        type: "error",
        title: "Could not resolve",
        description: extractApiError(error),
      });
    }
  };

  const backButton = onBack ? (
    <button
      type="button"
      onClick={onBack}
      aria-label="Back to conversations"
      className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100 active:bg-ink-100 lg:hidden"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  ) : null;

  const escalationActions = (canEscalate || canClaim || canResolve) && (
    <div className="flex flex-wrap items-center gap-2">
      {canEscalate && (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Siren className="h-4 w-4" />}
          onClick={() => setEscalating(true)}
        >
          Escalate to PIPDC
        </Button>
      )}
      {canClaim && (
        <Button
          size="sm"
          leftIcon={<ShieldCheck className="h-4 w-4" />}
          loading={claim.isPending}
          onClick={handleClaim}
        >
          Claim
        </Button>
      )}
      {canResolve && (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<CheckCircle2 className="h-4 w-4" />}
          loading={resolve.isPending}
          onClick={handleResolve}
        >
          Resolve
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex h-[70dvh] min-h-[300px] flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <EscalationBanner
        conversation={conversation}
        currentUserId={currentUserId}
      />

      <div className="border-b border-ink-100 p-4">
        {canSend ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {backButton}
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-gradient text-sm font-semibold text-white">
                {otherName.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {otherName}
                </p>
                <p className="truncate text-xs text-ink-500">{otherMeta}</p>
              </div>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="hidden max-w-[200px] truncate text-xs text-ink-500 sm:block">
                {conversation.property.title}
              </span>
              <Link
                to={`/properties/${conversation.property.slug}`}
                className="shrink-0"
              >
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ExternalLink className="h-4 w-4" />}
                >
                  View Property
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {backButton}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {conversation.property.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-500">
                  {conversation.client.fullName} ↔ {conversation.agent.fullName}
                </p>
              </div>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Link
                to={`/properties/${conversation.property.slug}`}
                className="shrink-0"
              >
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ExternalLink className="h-4 w-4" />}
                >
                  View Property
                </Button>
              </Link>
            </div>
          </div>
        )}

        {escalationActions && (
          <div className="mt-3 border-t border-ink-100 pt-3">
            {escalationActions}
          </div>
        )}
      </div>

      <MessageList
        messages={messagesQuery.data ?? []}
        currentUserId={currentUserId}
        isLoading={messagesQuery.isLoading}
        isError={messagesQuery.isError}
        onRetry={() => messagesQuery.refetch()}
      />

      <div className="border-t border-ink-100 bg-white">
        {!composerEnabled && (
          <p className="flex items-center gap-2 bg-ink-50 px-4 py-2 text-xs text-ink-500">
            <Eye className="h-3.5 w-3.5 shrink-0" />
            {isAdmin && status === "Escalated"
              ? "Waiting to be claimed. Claim this case to reply to the client."
              : isAdmin
                ? "You are viewing this conversation as an administrator. Only the client, the property agent, and the assigned PIPDC officer can send messages."
                : status === "Assigned"
                  ? "PIPDC has taken over this conversation, so it is now read-only for you."
                  : "This conversation is closed, so it is read-only."}
          </p>
        )}
        <MessageComposer
          canSend={composerEnabled}
          sending={sendMessage.isPending}
          onSend={handleSend}
        />
      </div>

      <EscalateConversationDialog
        conversation={escalating ? conversation : null}
        onClose={() => setEscalating(false)}
      />
    </div>
  );
}
