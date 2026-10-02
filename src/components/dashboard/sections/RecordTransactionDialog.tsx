import { useState } from "react";
import { Modal } from "../../ui/Modal";
import { Input, Select, Textarea } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { useRecordLease, useRecordSale } from "../../../hooks/useTransactions";
import { extractApiError } from "../../../services/api";
import { useToast } from "../../ui/Toast";
import type { Property } from "../../../types";

export function RecordTransactionDialog({
  property,
  onClose,
}: {
  property: Property | null;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<"Sale" | "Lease">("Sale");
  const [salePrice, setSalePrice] = useState("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [buyerName, setBuyerName] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantContact, setTenantContact] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const { notify } = useToast();
  const sale = useRecordSale();
  const lease = useRecordLease();
  const pending = sale.isPending || lease.isPending;

  const submit = async () => {
    if (!property) return;
    try {
      const idempotencyKey = crypto.randomUUID();
      if (kind === "Sale") {
        await sale.mutateAsync({
          propertyId: property.id,
          idempotencyKey,
          payload: {
            salePrice: Number(salePrice),
            saleDate,
            buyerName,
            buyerContact,
            notes: notes || null,
          },
        });
      } else {
        await lease.mutateAsync({
          propertyId: property.id,
          idempotencyKey,
          payload: {
            tenantName,
            tenantContact,
            monthlyRent: Number(monthlyRent),
            leaseStartDate: startDate,
            leaseEndDate: endDate,
            notes: notes || null,
          },
        });
      }
      notify({
        type: "success",
        title: kind === "Sale" ? "Sale recorded" : "Rental recorded",
        description: `${property.title} has been updated.`,
      });
      onClose();
    } catch (error) {
      notify({
        type: "error",
        title: "Could not record transaction",
        description: extractApiError(error),
      });
    }
  };

  return (
    <Modal
      open={property != null}
      onClose={onClose}
      title="Record confirmed transaction"
      description={
        property ? `This changes the status of ${property.title}.` : undefined
      }
    >
      <div className="space-y-4">
        <Select
          label="Transaction type"
          value={kind}
          onChange={(event) => setKind(event.target.value as "Sale" | "Lease")}
        >
          <option value="Sale">Sale</option>
          <option value="Lease">Rental</option>
        </Select>
        {kind === "Sale" ? (
          <>
            <Input
              label="Sale price"
              type="number"
              min="0"
              value={salePrice}
              onChange={(event) => setSalePrice(event.target.value)}
              required
            />
            <Input
              label="Sale date"
              type="date"
              value={saleDate}
              onChange={(event) => setSaleDate(event.target.value)}
              required
            />
            <Input
              label="Buyer name"
              value={buyerName}
              onChange={(event) => setBuyerName(event.target.value)}
              required
            />
            <Input
              label="Buyer contact"
              value={buyerContact}
              onChange={(event) => setBuyerContact(event.target.value)}
              required
            />
          </>
        ) : (
          <>
            <Input
              label="Monthly rent"
              type="number"
              min="0"
              value={monthlyRent}
              onChange={(event) => setMonthlyRent(event.target.value)}
              required
            />
            <Input
              label="Tenant name"
              value={tenantName}
              onChange={(event) => setTenantName(event.target.value)}
              required
            />
            <Input
              label="Tenant contact"
              value={tenantContact}
              onChange={(event) => setTenantContact(event.target.value)}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Lease starts"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
              <Input
                label="Lease ends"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
              />
            </div>
          </>
        )}
        <Textarea
          label="Notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional transaction notes"
        />
        <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => void submit()}
            loading={pending}
            disabled={
              kind === "Sale"
                ? !salePrice || !saleDate || !buyerName || !buyerContact
                : !monthlyRent ||
                  !tenantName ||
                  !tenantContact ||
                  !startDate ||
                  !endDate
            }
          >
            Record transaction
          </Button>
        </div>
      </div>
    </Modal>
  );
}
