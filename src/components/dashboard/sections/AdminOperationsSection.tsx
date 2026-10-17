import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { useTransactionAnalytics, useTransactions } from "../../../hooks/useTransactions";
import { Badge } from "../../ui/Badge";
import { LoadingRows, SectionFooter, tdClass, thClass } from "./shared";
import type {
  Transaction,
  TransactionAnalytics,
  TransactionKind,
} from "../../../types";

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

/**
 * The aggregates above answer "how much". An admin also needs "who": which client
 * bought or rented which property, and when. Without this the only way to find
 * that out is to open each listing and remember what happened, which is exactly
 * the question the transaction table is recorded to answer.
 */
function TransactionLedger() {
  const [kind, setKind] = useState<TransactionKind | "">("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const transactionsQuery = useTransactions({
    kind: kind || undefined,
    page,
    pageSize,
  });

  const transactions = transactionsQuery.data?.items ?? [];
  const totalCount = transactionsQuery.data?.totalCount ?? 0;

  const counterparty = (t: Transaction) =>
    t.kind === "Sale" ? (t.buyerName ?? "Unknown buyer") : (t.tenantName ?? "Unknown tenant");

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink-900">
            Who bought or rented what
          </h2>
          <p className="text-sm text-ink-500">
            Every recorded deal, newest first.
          </p>
        </div>
        <select
          value={kind}
          onChange={(event) => {
            setKind(event.target.value as TransactionKind | "");
            setPage(1);
          }}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
        >
          <option value="">Sales and rentals</option>
          <option value="Sale">Sales only</option>
          <option value="Lease">Rentals only</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={thClass}>Client</th>
              <th className={thClass}>Property</th>
              <th className={thClass}>Deal</th>
              <th className={thClass}>Value</th>
              <th className={thClass}>Date</th>
              <th className={thClass}>Recorded by</th>
            </tr>
          </thead>
          <tbody>
            {transactionsQuery.isLoading ? (
              <LoadingRows rows={6} />
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className={tdClass}>
                  No transactions recorded yet.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={`${t.kind}-${t.id}`}>
                  <td className={tdClass}>
                    <span className="font-medium text-ink-900">{counterparty(t)}</span>
                    {t.counterpartyUserId ? (
                      <span className="block text-xs text-ink-400">Registered client</span>
                    ) : (
                      <span className="block text-xs text-amber-600">No client account</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    {t.propertyTitle}
                    <span className="block text-xs text-ink-400">
                      {[t.propertyCity, t.propertyState].filter(Boolean).join(", ")}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <Badge tone={t.kind === "Sale" ? "forest" : "gold"}>
                      {t.kind === "Sale" ? "Sold" : "Rented"}
                    </Badge>
                    <span className="block text-xs text-ink-400">{t.statusLabel}</span>
                  </td>
                  <td className={tdClass}>
                    {t.kind === "Sale" && t.salePrice != null
                      ? `${t.currency} ${moneyFormat.format(t.salePrice)}`
                      : t.monthlyRent != null
                        ? `${t.currency} ${moneyFormat.format(t.monthlyRent)}/mo`
                        : "—"}
                  </td>
                  <td className={tdClass}>
                    {(t.saleDate ?? t.leaseStartDate ?? t.createdAt).slice(0, 10)}
                  </td>
                  <td className={tdClass}>{t.recordedByName}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SectionFooter
        pageNumber={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
      />
    </section>
  );
}

export function AdminOperationsSection() {
  const analyticsQuery = useTransactionAnalytics();

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
      <TransactionLedger />
    </div>
  );
}
