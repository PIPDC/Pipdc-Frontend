import { useState } from "react";
import { ArrowLeft, CheckCircle2, MessageSquare, RefreshCw, ShieldAlert } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  useClaimConversation,
  useEscalationQueue,
} from "../../../hooks/useConversationEscalation";
import { extractApiError } from "../../../services/api";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { EmptyState } from "../../ui/EmptyState";
import { useToast } from "../../ui/Toast";
import { ConversationView } from "../../messaging/ConversationView";
import type { Conversation } from "../../../types";

/**
 * The administrator's escalation queue. This is the destination of the link in
 * the "escalated to an administrator" email, so it lives at its own route and
 * is not reachable only by knowing that Statistics happens to contain it.
 */
export function EscalationsSection() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [selected, setSelected] = useState<Conversation | null>(null);
  const queueQuery = useEscalationQueue({ pageNumber: 1, pageSize: 50 });
  const claim = useClaimConversation();
  const queue = queueQuery.data?.items ?? [];

  const claimCase = async (conversation: Conversation) => {
    try {
      const claimed = await claim.mutateAsync(conversation.id);
      setSelected(claimed);
      notify({
        type: "success",
        title: "Case claimed",
        description: "The conversation is ready for your response.",
      });
    } catch (error) {
      notify({
        type: "error",
        title: "Could not claim case",
        description: extractApiError(error),
      });
    }
  };

  if (selected)
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => setSelected(null)}
        >
          Back to escalations
        </Button>
        <ConversationView
          conversation={selected}
          currentUserId={user?.id ?? ""}
          canSend={false}
          isAdmin
          isAssignedAgent={false}
          onBack={() => setSelected(null)}
        />
      </div>
    );

  return (
    <section className="rounded-2xl border border-ink-100 bg-white shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-gold-600" />
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">
              Conversation escalations
            </h2>
            <p className="text-sm text-ink-500">
              Claim an escalated conversation to respond and resolve it.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => void queueQuery.refetch()}
        >
          Refresh
        </Button>
      </div>
      {queueQuery.isLoading ? (
        <div className="p-6 text-sm text-ink-500">Loading escalations...</div>
      ) : queue.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="No escalated conversations"
          description="New escalated conversations will appear here."
        />
      ) : (
        <div className="divide-y divide-ink-50">
          {queue.map((conversation) => (
            <div
              key={conversation.id}
              className="flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-forest-600" />
                  <p className="font-semibold text-ink-900">
                    {conversation.client.fullName}
                  </p>
                  <Badge
                    tone={conversation.escalationStatus === "Assigned" ? "success" : "warning"}
                  >
                    {conversation.escalationStatus}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-ink-600">
                  {conversation.property.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-ink-500">
                  {conversation.escalationReason ?? "No reason provided"}
                </p>
              </div>
              <Button
                size="sm"
                loading={claim.isPending && claim.variables === conversation.id}
                onClick={() =>
                  conversation.escalationStatus === "Escalated"
                    ? claimCase(conversation)
                    : setSelected(conversation)
                }
              >
                {conversation.escalationStatus === "Escalated" ? "Claim case" : "Open case"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
