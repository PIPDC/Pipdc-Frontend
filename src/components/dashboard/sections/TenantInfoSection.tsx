import { useState } from "react";
import { AlertTriangle, Bell, CalendarClock, DoorOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { Input } from "../../ui/Input";
import { Modal } from "../../ui/Modal";
import { useEndLease, useNotifyTenant, useRenewLease, useTenants } from "../../../hooks/useTransactions";
import { extractApiError } from "../../../services/api";
import { useToast } from "../../ui/Toast";
import { CardTable, LoadingRows, TableEmpty, tdClass, thClass } from "./shared";
import type { TenantInfo } from "../../../types";

const moneyFormat = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

/** Default renewal term: the same tenancy extended by a year. */
function defaultRenewalEnd(leaseEndDate: string): string {
  const next = new Date(leaseEndDate);
  next.setFullYear(next.getFullYear() + 1);
  return next.toISOString().slice(0, 10);
}

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
 * left on their lease, extend the tenancy for another term, or end it once the
 * tenant has left. Ending a tenancy is the only action that returns the property
 * to the market - a rented listing cannot be flipped to Available by editing its
 * status, so the record of who lived there is never lost.
 */
export function TenantInfoSection() {
  const tenantsQuery = useTenants();
  const notifyTenant = useNotifyTenant();
  const renewLease = useRenewLease();
  const endLease = useEndLease();
  const { notify } = useToast();

  const [notifyingId, setNotifyingId] = useState<number | null>(null);
  const [renewTarget, setRenewTarget] = useState<TenantInfo | null>(null);
  const [newEndDate, setNewEndDate] = useState("");
  const [endTarget, setEndTarget] = useState<TenantInfo | null>(null);

  const tenants = tenantsQuery.data ?? [];
  const busy = notifyingId !== null || renewLease.isPending || endLease.isPending;

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

  const openRenew = (tenant: TenantInfo) => {
    setRenewTarget(tenant);
    setNewEndDate(defaultRenewalEnd(tenant.leaseEndDate));
  };

  const handleRenew = async () => {
    if (!renewTarget) return;
    try {
      await renewLease.mutateAsync({
        leaseId: renewTarget.leaseId,
        newEndDate,
        propertyId: renewTarget.propertyId,
      });
      notify({
        type: "success",
        title: "Tenancy renewed",
        description: `${renewTarget.tenantName}'s lease now runs to ${newEndDate}.`,
      });
      setRenewTarget(null);
    } catch (err) {
      notify({ type: "error", title: "Could not renew tenancy", description: extractApiError(err) });
    }
  };

  const handleEnd = async () => {
    if (!endTarget) return;
    try {
      await endLease.mutateAsync({ leaseId: endTarget.leaseId, propertyId: endTarget.propertyId });
      notify({
        type: "success",
        title: "Tenancy ended",
        description: `${endTarget.tenantName} has been moved out and the property is available again.`,
      });
      setEndTarget(null);
    } catch (err) {
      notify({ type: "error", title: "Could not end tenancy", description: extractApiError(err) });
    }
  };

  return (
    <>
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
          <table className="w-full min-w-[1000px] border-collapse">
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
                    <Link to={`/properties/${tenant.propertySlug}`} className="font-medium text-forest-600 hover:text-forest-700">
                      {tenant.propertyTitle}
                    </Link>
                    <span className="block text-xs text-ink-400">
                      {tenant.propertyCity}, {tenant.propertyState}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <span className="text-ink-600">
                      {tenant.leaseStartDate.slice(0, 10)} &rarr; {tenant.leaseEndDate.slice(0, 10)}
                    </span>
                  </td>
                  <td className={tdClass}>
                    {tenant.currency} {moneyFormat.format(tenant.monthlyRent)}/mo
                  </td>
                  <td className={tdClass}>
                    <Remaining tenant={tenant} />
                  </td>
                  <td className={tdClass}>
                    {tenant.reminderSentAt ? (
                      <span className="text-xs text-ink-500">Sent {tenant.reminderSentAt.slice(0, 10)}</span>
                    ) : (
                      <span className="text-xs text-ink-400">Not sent</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Bell className="h-4 w-4" />}
                        loading={notifyingId === tenant.leaseId}
                        disabled={busy}
                        onClick={() => void handleNotify(tenant)}
                      >
                        Notify
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<CalendarClock className="h-4 w-4" />}
                        disabled={busy}
                        onClick={() => openRenew(tenant)}
                      >
                        Renew
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<DoorOpen className="h-4 w-4" />}
                        disabled={busy}
                        onClick={() => setEndTarget(tenant)}
                      >
                        End
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardTable>

      <Modal
        open={renewTarget !== null}
        onClose={() => setRenewTarget(null)}
        title="Renew tenancy"
        size="sm"
      >
        {renewTarget && (
          <div className="space-y-5">
            <p className="text-sm text-ink-600">
              Extend <span className="font-medium text-ink-900">{renewTarget.tenantName}</span>&apos;s lease. The
              property stays rented. The current term ends {renewTarget.leaseEndDate.slice(0, 10)}.
            </p>
            <Input
              type="date"
              label="New lease end date"
              value={newEndDate}
              min={renewTarget.leaseEndDate.slice(0, 10)}
              onChange={(e) => setNewEndDate(e.target.value)}
              hint="The new end date must be the same as or later than the current one."
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="md" onClick={() => setRenewTarget(null)} disabled={renewLease.isPending}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => void handleRenew()}
                loading={renewLease.isPending}
                disabled={!newEndDate}
              >
                Renew tenancy
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={endTarget !== null}
        title="End this tenancy?"
        description={
          endTarget ? (
            <>
              This marks {endTarget.tenantName}&apos;s lease as ended and returns{" "}
              <span className="font-medium text-ink-900">{endTarget.propertyTitle}</span> to the market as Available.
              Use this only once the tenant has actually moved out.
            </>
          ) : undefined
        }
        confirmLabel="End tenancy"
        loading={endLease.isPending}
        onConfirm={() => void handleEnd()}
        onCancel={() => setEndTarget(null)}
      />
    </>
  );
}
