import { useState } from "react";
import { AlertTriangle, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { useNotifyTenant, useTenants } from "../../../hooks/useTransactions";
import { extractApiError } from "../../../services/api";
import { useToast } from "../../ui/Toast";
import { CardTable, LoadingRows, TableEmpty, tdClass, thClass } from "./shared";
import type { TenantInfo } from "../../../types";

const moneyFormat = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

function Remaining({ tenant }: { tenant: TenantInfo }) {
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
 * Admin view of who is currently occupying each rented property. Beyond the
 * roster, the page is where an admin can send a tenant a reminder about the time
 * left on their lease. The same reminder also goes out automatically a month
 * before expiry, so the button is for an extra nudge or a custom message window.
 */
export function TenantInfoSection() {
  const tenantsQuery = useTenants();
  const notifyTenant = useNotifyTenant();
  const { notify } = useToast();
  const [notifyingId, setNotifyingId] = useState<number | null>(null);

  const tenants = tenantsQuery.data ?? [];

  const handleNotify = async (tenant: TenantInfo) => {
    setNotifyingId(tenant.leaseId);
    try {
      const result = await notifyTenant.mutateAsync(tenant.leaseId);
      const remaining =
        result.daysRemaining < 0
          ? "their lease has already ended"
          : `${result.daysRemaining} day${result.daysRemaining === 1 ? "" : "s"} remaining`;
      notify({
        type: "success",
        title: "Tenant notified",
        description: `A rent-expiry reminder was sent to ${result.tenantEmail} (${remaining}).`,
      });
    } catch (err) {
      notify({ type: "error", title: "Could not notify tenant", description: extractApiError(err) });
    } finally {
      setNotifyingId(null);
    }
  };

  return (
    <CardTable title="Tenants">
      {tenantsQuery.isLoading ? (
        <LoadingRows rows={5} />
      ) : tenantsQuery.isError ? (
        <div className="flex flex-col items-center gap-3 p-12 text-center">
          <AlertTriangle className="h-6 w-6 text-gold-500" />
          <p className="text-sm text-ink-500">Could not load tenant information.</p>
          <Button variant="outline" size="sm" onClick={() => tenantsQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : tenants.length === 0 ? (
        <TableEmpty />
      ) : (
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-ink-100 bg-white/60">
              <th className={thClass}>Tenant</th>
              <th className={thClass}>Property</th>
              <th className={thClass}>Lease</th>
              <th className={thClass}>Rent</th>
              <th className={thClass}>Remaining</th>
              <th className={thClass}>Reminder</th>
              <th className={thClass}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50 bg-white">
            {tenants.map((tenant) => (
              <tr key={tenant.leaseId} className="transition-colors hover:bg-ink-50/60">
                <td className={tdClass}>
                  <span className="font-medium text-ink-900">{tenant.tenantName}</span>
                  <span className="block text-xs text-ink-400">{tenant.tenantEmail}</span>
                  <span className="block text-xs text-ink-400">{tenant.tenantPhone}</span>
                </td>
                <td className={tdClass}>
                  <Link
                    to={`/properties/${tenant.propertySlug}`}
                    className="font-medium text-forest-600 hover:text-forest-700"
                  >
                    {tenant.propertyTitle}
                  </Link>
                  <span className="block text-xs text-ink-400">
                    {tenant.propertyCity}, {tenant.propertyState}
                  </span>
                </td>
                <td className={tdClass}>
                  <span className="block text-ink-700">
                    {tenant.leaseStartDate.slice(0, 10)} → {tenant.leaseEndDate.slice(0, 10)}
                  </span>
                  <span className="text-xs text-ink-400">{tenant.statusLabel}</span>
                </td>
                <td className={tdClass}>
                  {tenant.currency} {moneyFormat.format(tenant.monthlyRent)}/mo
                </td>
                <td className={tdClass}>
                  <Remaining tenant={tenant} />
                </td>
                <td className={tdClass}>
                  {tenant.reminderSentAt ? (
                    <span className="text-xs text-ink-500">
                      Sent {tenant.reminderSentAt.slice(0, 10)}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-400">Not sent</span>
                  )}
                </td>
                <td className={tdClass}>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Bell className="h-4 w-4" />}
                      loading={notifyingId === tenant.leaseId}
                      disabled={notifyingId !== null}
                      onClick={() => void handleNotify(tenant)}
                    >
                      Notify
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CardTable>
  );
}
