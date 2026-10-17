import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { useMyTenancies } from "../../../hooks/useTransactions";
import { CardTable, LoadingRows, TableEmpty, tdClass, thClass } from "./shared";
import type { TenantInfo, TransactionStatus } from "../../../types";

const moneyFormat = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

function statusTone(status: TransactionStatus): "success" | "gold" | "danger" | "neutral" {
  if (status === "Active") return "success";
  if (status === "Pending") return "gold";
  if (status === "Terminated" || status === "Cancelled") return "danger";
  return "neutral";
}

function Remaining({ tenant }: { tenant: TenantInfo }) {
  if (tenant.status === "Terminated" || tenant.status === "Cancelled") {
    return <span className="text-xs text-ink-400">No longer active</span>;
  }
  if (tenant.daysRemaining < 0) {
    return <Badge tone="danger">Expired {Math.abs(tenant.daysRemaining)}d ago</Badge>;
  }
  if (tenant.daysRemaining === 0) {
    return <Badge tone="danger">Expires today</Badge>;
  }
  if (tenant.reminderDue) {
    return <Badge tone="gold">{tenant.daysRemaining}d left</Badge>;
  }
  return <span className="text-ink-600">{tenant.daysRemaining}d left</span>;
}

/**
 * A client's own tenancies, the counterpart of the admin Tenants page. Scoped to
 * the signed-in user server-side, it shows both current and past leases so the
 * client can see where they rent and when each term runs out.
 */
export function MyTenanciesSection() {
  const tenanciesQuery = useMyTenancies();
  const tenancies = tenanciesQuery.data ?? [];

  return (
    <CardTable title="My Rentals">
      {tenanciesQuery.isLoading ? (
        <LoadingRows rows={5} />
      ) : tenanciesQuery.isError ? (
        <div className="flex flex-col items-center gap-3 p-12 text-center">
          <AlertTriangle className="h-6 w-6 text-gold-500" />
          <p className="text-sm text-ink-500">Could not load your rentals.</p>
          <Button variant="outline" size="sm" onClick={() => tenanciesQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : tenancies.length === 0 ? (
        <TableEmpty />
      ) : (
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr className="border-b border-ink-100 bg-white/60">
              <th className={thClass}>Property</th>
              <th className={thClass}>Lease</th>
              <th className={thClass}>Rent</th>
              <th className={thClass}>Remaining</th>
              <th className={thClass}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50 bg-white">
            {tenancies.map((tenancy) => (
              <tr key={tenancy.leaseId} className="transition-colors hover:bg-ink-50/60">
                <td className={tdClass}>
                  <Link
                    to={`/properties/${tenancy.propertySlug}`}
                    className="font-medium text-forest-600 hover:text-forest-700"
                  >
                    {tenancy.propertyTitle}
                  </Link>
                  <span className="block text-xs text-ink-400">
                    {tenancy.propertyCity}, {tenancy.propertyState}
                  </span>
                </td>
                <td className={tdClass}>
                  <span className="text-ink-600">
                    {tenancy.leaseStartDate.slice(0, 10)} &rarr; {tenancy.leaseEndDate.slice(0, 10)}
                  </span>
                </td>
                <td className={tdClass}>
                  {tenancy.currency} {moneyFormat.format(tenancy.monthlyRent)}/mo
                </td>
                <td className={tdClass}>
                  <Remaining tenant={tenancy} />
                </td>
                <td className={tdClass}>
                  <Badge tone={statusTone(tenancy.status)}>{tenancy.statusLabel}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CardTable>
  );
}
