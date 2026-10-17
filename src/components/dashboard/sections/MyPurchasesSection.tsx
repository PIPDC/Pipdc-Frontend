import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { useMyPurchases } from "../../../hooks/useTransactions";
import { CardTable, LoadingRows, TableEmpty, tdClass, thClass } from "./shared";

const moneyFormat = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

/**
 * A client's own property purchases, the counterpart of the admin Purchasers
 * page. The API scopes the read to the signed-in user, so a client can track
 * what they bought without seeing anyone else's deals.
 */
export function MyPurchasesSection() {
  const purchasesQuery = useMyPurchases();
  const purchases = purchasesQuery.data ?? [];

  return (
    <CardTable title="My Purchases">
      {purchasesQuery.isLoading ? (
        <LoadingRows rows={5} />
      ) : purchasesQuery.isError ? (
        <div className="flex flex-col items-center gap-3 p-12 text-center">
          <AlertTriangle className="h-6 w-6 text-gold-500" />
          <p className="text-sm text-ink-500">Could not load your purchases.</p>
          <Button variant="outline" size="sm" onClick={() => purchasesQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : purchases.length === 0 ? (
        <TableEmpty />
      ) : (
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-ink-100 bg-white/60">
              <th className={thClass}>Property</th>
              <th className={thClass}>Purchase price</th>
              <th className={thClass}>Purchase date</th>
              <th className={thClass}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50 bg-white">
            {purchases.map((purchase) => (
              <tr key={purchase.saleId} className="transition-colors hover:bg-ink-50/60">
                <td className={tdClass}>
                  <Link
                    to={`/properties/${purchase.propertySlug}`}
                    className="font-medium text-forest-600 hover:text-forest-700"
                  >
                    {purchase.propertyTitle}
                  </Link>
                  <span className="block text-xs text-ink-400">
                    {purchase.propertyCity}, {purchase.propertyState}
                  </span>
                </td>
                <td className={tdClass}>
                  {purchase.currency} {moneyFormat.format(purchase.salePrice)}
                </td>
                <td className={tdClass}>{purchase.saleDate.slice(0, 10)}</td>
                <td className={tdClass}>
                  <Badge tone="success">{purchase.statusLabel}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CardTable>
  );
}
