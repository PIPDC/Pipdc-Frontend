import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  MessagesSquare,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { primaryRole } from "../../utils/roles";
import {
  useConversations,
  useConversation,
  useEnquiryConversationState,
} from "../../hooks/queries";
import { useMarkConversationRead } from "../../hooks/mutations";
import { useConversationSubscription } from "../../hooks/useConversationSubscription";
import { useNewMessageListener } from "../../hooks/useNewMessageListener";
import { useEscalationChangeListener } from "../../hooks/useEscalationChangeListener";
import { conversationService } from "../../services/conversationService";
import { enquiryService } from "../../services/enquiryService";
import { extractApiError } from "../../services/api";
import { useToast } from "../ui/Toast";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { cn } from "../../utils/cn";
import type { Conversation } from "../../types";
import { ConversationList } from "./ConversationList";
import { ConversationView } from "./ConversationView";
import { NewConversationView } from "./NewConversationView";

const parseId = (value: string | null | undefined): number | null =>
  value && /^\d+$/.test(value) ? Number(value) : null;

export function MessagingSection() {
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = primaryRole(user?.roles);

  // Selection is URL-driven: the open conversation is the :conversationId path
  // segment. The legacy ?conversation= query is still honoured so any older
  // link keeps working.
  const selectedId =
    parseId(params.conversationId) ?? parseId(searchParams.get("conversation"));

  useConversationSubscription(selectedId);
  useNewMessageListener();
  useEscalationChangeListener();

  const enquiryId = parseId(searchParams.get("enquiry"));
  const propertyId = parseId(searchParams.get("property"));

  const conversationsQuery = useConversations();
  const listItems = conversationsQuery.data?.items ?? [];

  const needsDetailFetch =
    selectedId !== null && !listItems.some((c) => c.id === selectedId);
  const conversationDetail = useConversation(
    needsDetailFetch ? selectedId : undefined,
  );
  const [justCreated, setJustCreated] = useState<Conversation | null>(null);
  const selected =
    justCreated ??
    (selectedId !== null
      ? (listItems.find((c) => c.id === selectedId) ?? conversationDetail.data)
      : undefined);
  // The id was not in the list and fetching it failed: it is invalid, or the
  // viewer is not a participant. That is a not-found state, not "nothing chosen".
  const detailFailed = needsDetailFetch && conversationDetail.isError;

  const stateQuery = useEnquiryConversationState(enquiryId ?? undefined);
  const markRead = useMarkConversationRead();

  const attemptedProperty = useRef<number | null>(null);
  const attemptedRead = useRef<number | null>(null);
  const [resolvingProperty, setResolvingProperty] = useState(false);

  const closeConversation = () => {
    if (params.conversationId)
      navigate("/dashboard/messages", { replace: true });
    else setSearchParams({}, { replace: true });
  };

  useEffect(() => {
    if (justCreated && selectedId !== justCreated.id) setJustCreated(null);
  }, [justCreated, selectedId]);

  // Opening an enquiry never creates a Conversation: the backend returns the
  // messaging state read-only. If that enquiry already has a Conversation, move
  // to its canonical URL so the path param drives the selection.
  useEffect(() => {
    if (enquiryId === null || !stateQuery.data?.conversation) return;
    const conversationId = stateQuery.data.conversation.id;
    if (selectedId === conversationId) return;
    navigate(`/dashboard/messages/${conversationId}`, { replace: true });
  }, [enquiryId, stateQuery.data, selectedId, navigate]);

  // Direct ?property= entry looks for an existing conversation about that
  // property WITHOUT creating an enquiry. If the client has messaged about it
  // before, the conversation is opened; otherwise they are sent back to the
  // property to start one deliberately with "Message agent".
  useEffect(() => {
    if (
      propertyId === null ||
      attemptedProperty.current === propertyId ||
      !user
    )
      return;
    attemptedProperty.current = propertyId;
    setResolvingProperty(true);
    enquiryService
      .mineByProperty(propertyId)
      .then((enquiry) => {
        if (!enquiry) {
          notify({
            type: "info",
            title: "No conversation yet",
            description: "Open the property and tap Message agent to start one.",
          });
          navigate("/dashboard/messages", { replace: true });
          return;
        }
        return conversationService
          .getConversationForEnquiry(enquiry.id)
          .then((conversationId) => {
            if (conversationId === null) {
              notify({
                type: "info",
                title: "No conversation yet",
                description:
                  "Open the property and tap Message agent to start one.",
              });
              navigate("/dashboard/messages", { replace: true });
              return;
            }
            navigate(`/dashboard/messages/${conversationId}`, {
              replace: true,
            });
          });
      })
      .catch((err) => {
        notify({
          type: "error",
          title: "Could not open conversation",
          description: extractApiError(err),
        });
        navigate("/dashboard/messages", { replace: true });
      })
      .finally(() => setResolvingProperty(false));
  }, [propertyId, user, notify, navigate]);

  useEffect(() => {
    if (
      selectedId === null ||
      role === "Admin" ||
      attemptedRead.current === selectedId
    )
      return;
    attemptedRead.current = selectedId;
    markRead.mutate(selectedId);
  }, [selectedId, role, markRead]);

  const canSend = role !== "Admin";
  const currentUserId = user?.id ?? "";
  // Batch 6: only the agent who actually handles the listing may hand the thread
  // over. Derived from the conversation's own agent id, not from a role alone.
  const isAssignedAgent =
    role === "Agent" &&
    selected != null &&
    selected.agent.agentId != null &&
    selected.agent.userId === currentUserId;

  const hasActivePane =
    selectedId !== null || enquiryId !== null || resolvingProperty;

  const loadingPane = (
    <div className="flex h-[70dvh] min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-ink-100 bg-white text-ink-500">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-forest-500 border-t-transparent" />
      <p className="text-sm">Opening conversation…</p>
    </div>
  );

  const renderPane = () => {
    if (resolvingProperty) return loadingPane;

    if (enquiryId !== null) {
      if (
        stateQuery.isLoading ||
        (stateQuery.data?.conversation && !selected)
      ) {
        return loadingPane;
      }

      if (stateQuery.isError) {
        return (
          <div className="flex h-[70dvh] min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-ink-100 bg-white text-ink-500">
            <AlertTriangle className="h-6 w-6 text-gold-500" />
            <p className="text-sm">Could not load this conversation.</p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => stateQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        );
      }

      const state = stateQuery.data;
      if (state && !state.conversation) {
        return (
          <NewConversationView
            enquiryId={enquiryId}
            client={state.client}
            agent={state.agent}
            property={state.property}
            currentUserId={currentUserId}
            canSend={canSend}
            onSent={(conversation) => {
              setJustCreated(conversation);
              navigate(`/dashboard/messages/${conversation.id}`, {
                replace: true,
              });
            }}
            onBack={closeConversation}
          />
        );
      }
    }

    if (selectedId !== null) {
      if (selected) {
        return (
          <ConversationView
            conversation={selected}
            currentUserId={currentUserId}
            canSend={canSend}
            isAdmin={role === "Admin"}
            isAssignedAgent={isAssignedAgent}
            onBack={closeConversation}
          />
        );
      }

      if (detailFailed) {
        return (
          <EmptyState
            icon={<AlertTriangle className="h-6 w-6" />}
            title="Conversation not found"
            description="This conversation does not exist, or you are not a participant in it."
            action={
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={closeConversation}
              >
                Back to conversations
              </Button>
            }
          />
        );
      }

      // Still fetching the conversation the URL points at: show a skeleton
      // rather than the empty state, so selection never flickers back.
      return loadingPane;
    }

    return (
      <EmptyState
        icon={<MessagesSquare className="h-6 w-6" />}
        title="Select a conversation"
        description="Choose a conversation from the list to read and reply, or open a property and tap Message agent to start a new one."
      />
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px,minmax(0,1fr)]">
      <div className={cn(hasActivePane ? "hidden lg:block" : undefined)}>
        <ConversationList
          conversations={listItems}
          isLoading={conversationsQuery.isLoading}
          isError={conversationsQuery.isError}
          onRetry={() => conversationsQuery.refetch()}
          selectedId={selectedId}
          currentUserId={currentUserId}
          onSelect={(id) => navigate(`/dashboard/messages/${id}`)}
        />
      </div>
      <div className={cn(!hasActivePane ? "hidden lg:block" : undefined)}>
        {renderPane()}
      </div>
    </div>
  );
}
