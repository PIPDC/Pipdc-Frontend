import { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  useClaimConversation,
  useEscalationQueue,
} from "../../../hooks/useConversationEscalation";
import { useTransactionAnalytics } from "../../../hooks/useTransactions";
import { extractApiError } from "../../../services/api";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { EmptyState } from "../../ui/EmptyState";
import { useToast } from "../../ui/Toast";
import { ConversationView } from "../../messaging/ConversationView";
import type { Conversation, TransactionAnalytics } from "../../../types";

const numberFormat = new Intl.NumberFormat("en-NG");
const moneyFormat = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 0,
});

function Metric({
  label,
  value,
  tone = "forest",
}: {
  label: string;
  value: string | number;
  tone?: "forest" | "gold" | "dark";
}) {
  const tones = {
    forest: "bg-forest-50 text-forest-700",
    gold: "bg-gold-50 text-gold-700",
    dark: "bg-ink-900 text-white",
  };
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </p>
      <p
        className={`mt-3 inline-flex rounded-lg px-3 py-1 text-2xl font-bold ${tones[tone]}`}
      >
        {value}
      </p>
    </div>
  );
}

function AnalyticsPanel({ analytics }: { analytics: TransactionAnalytics }) {
  const { totals, enquiryToDealFunnel: funnel } = analytics;
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-forest-600" />
        <div>
          <h2 className="font-display text-lg font-bold text-ink-900">
            Transaction analytics
          </h2>
          <p className="text-sm text-ink-500">
            Confirmed records from the last twelve months.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Successful sales"
          value={numberFormat.format(totals.saleCount)}
        />
        <Metric
          label="Successful rentals"
          value={numberFormat.format(totals.leaseCount)}
          tone="gold"
        />
        <Metric
          label="Properties sold"
          value={numberFormat.format(totals.propertiesSold)}
          tone="dark"
        />
        <Metric
          label="Active rentals"
          value={numberFormat.format(totals.activeLeaseCount)}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h3 className="font-semibold text-ink-900">Enquiry to transaction</h3>
          <div className="mt-5 flex items-end gap-3">
            <p className="font-display text-4xl font-bold text-forest-700">
              {funnel.conversionRate == null
                ? "No data"
                : `${funnel.conversionRate.toFixed(1)}%`}
            </p>
            <p className="pb-1 text-sm text-ink-500">
              of {numberFormat.format(funnel.enquiryCount)} enquiries
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <p className="rounded-lg bg-forest-50 p-3 text-forest-800">
              Linked deals{" "}
              <strong className="block text-lg">
                {funnel.enquiriesLinkedToDeals}
              </strong>
            </p>
            <p className="rounded-lg bg-ink-50 p-3 text-ink-700">
              Still open{" "}
              <strong className="block text-lg">
                {funnel.enquiriesStillOpen}
              </strong>
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h3 className="font-semibold text-ink-900">Recorded value</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Sales value</dt>
              <dd className="font-semibold text-ink-900">
                {analytics.currency} {moneyFormat.format(totals.totalSaleValue)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Monthly rent</dt>
              <dd className="font-semibold text-ink-900">
                {analytics.currency}{" "}
                {moneyFormat.format(totals.totalMonthlyRent)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Properties rented</dt>
              <dd className="font-semibold text-ink-900">
                {totals.propertiesRented}
              </dd>
            </div>
          </dl>
          {!analytics.hasAnyTransactions && (
            <p className="mt-5 text-sm text-ink-500">
              No confirmed transactions have been recorded yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function AdminOperationsSection() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [selected, setSelected] = useState<Conversation | null>(null);
  const queueQuery = useEscalationQueue({ pageNumber: 1, pageSize: 50 });
  const analyticsQuery = useTransactionAnalytics();
  const claim = useClaimConversation();
  const queue = queueQuery.data?.items ?? [];

  if (selected)
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => setSelected(null)}
        >
          Back to operations
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

  return (
    <div className="space-y-8">
      {analyticsQuery.isLoading ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-6 text-sm text-ink-500">
          Loading analytics...
        </div>
      ) : analyticsQuery.isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
          Analytics could not be loaded.
        </div>
      ) : analyticsQuery.data ? (
        <AnalyticsPanel analytics={analyticsQuery.data} />
      ) : null}
      <section className="rounded-2xl border border-ink-100 bg-white shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-gold-600" />
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">
                Concierge escalations
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
            onClick={() => {
              void queueQuery.refetch();
              void analyticsQuery.refetch();
            }}
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
            description="New concierge handoffs will appear here."
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
                      tone={
                        conversation.escalationStatus === "Assigned"
                          ? "success"
                          : "warning"
                      }
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
                  loading={
                    claim.isPending && claim.variables === conversation.id
                  }
                  onClick={() =>
                    conversation.escalationStatus === "Escalated"
                      ? claimCase(conversation)
                      : setSelected(conversation)
                  }
                >
                  {conversation.escalationStatus === "Escalated"
                    ? "Claim case"
                    : "Open case"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
