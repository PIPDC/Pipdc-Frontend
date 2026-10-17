import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { usePurchasers } from "../../../hooks/useTransactions";
import { CardTable, LoadingRows, TableEmpty, tdClass, thClass } from "./shared";

const moneyFormat = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

/**
 * Admin roster of clients who purchased a property, with the contact details the
 * deal was recorded against. Buyers are thanked automatically when the sale is
 * recorded; this page exists so an admin can find and reach them afterwards.
 */
export function PurchasersSection() {
  const purchasersQuery = usePurchasers();
  const purchasers = purchasersQuery.data ?? [];

  return (
    <CardTable title="Purchasers">
      {purchasersQuery.isLoading ? (
        <LoadingRows rows={5} />
      ) : purchasersQuery.isError ? (
        <div className="flex flex-col items-center gap-3 p-12 text-center">
          <AlertTriangle className="h-6 w-6 text-gold-500" />
          <p className="text-sm text-ink-500">Could not load purchasers.</p>
          <Button variant="outline" size="sm" onClick={() => purchasersQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : purchasers.length === 0 ? (
        <TableEmpty />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-ink-100">
                <th className={thClass}>Buyer</th>
                <th className={thClass}>Property</th>
                <th className={thClass}>Sale price</th>
                <th className={thClass}>Sale date</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {purchasers.map((purchaser) => (
                <tr key={purchaser.saleId} className="transition-colors hover:bg-ink-50/60">
                  <td className={tdClass}>
                    <span className="font-medium text-ink-900">{purchaser.buyerName}</span>
                    <span className="block text-xs text-ink-400">{purchaser.buyerEmail}</span>
                    <span className="block text-xs text-ink-400">{purchaser.buyerPhone}</span>
                  </td>
                  <td className={tdClass}>
                    <Link
                      to={`/properties/${purchaser.propertySlug}`}
                      className="font-medium text-forest-600 hover:text-forest-700"
                    >
                      {purchaser.propertyTitle}
                    </Link>
                    <span className="block text-xs text-ink-400">
                      {purchaser.propertyCity}, {purchaser.propertyState}
                    </span>
                  </td>
                  <td className={tdClass}>
                    {purchaser.currency} {moneyFormat.format(purchaser.salePrice)}
                  </td>
                  <td className={tdClass}>{purchaser.saleDate.slice(0, 10)}</td>
                  <td className={tdClass}>
                    <Badge tone="success">{purchaser.statusLabel}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardTable>
  );
}
