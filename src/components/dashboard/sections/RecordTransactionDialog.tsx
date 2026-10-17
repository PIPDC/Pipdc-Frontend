import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../ui/Modal";
import { Input, Select, Textarea } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { useRecordLease, useRecordSale } from "../../../hooks/useTransactions";
import { usePropertyEnquiries } from "../../../hooks/queries";
import { extractApiError } from "../../../services/api";
import { useToast } from "../../ui/Toast";
import type { Enquiry, Property } from "../../../types";

/**
 * The two property states that can only be reached by filing paperwork. The
 * caller passes which one it is trying to set, and this dialog files the matching
 * record. The transaction service moves the property itself in the same database
 * transaction, so the caller must not follow up with a second status update.
 */
export type TransactionOutcome = "Sold" | "Rented";

export interface RecordedTransaction {
  outcome: TransactionOutcome;
  counterpartyName: string;
}

export function RecordTransactionDialog({
  property,
  outcome,
  onClose,
  onRecorded,
}: {
  property: Property | null;
  outcome: TransactionOutcome | null;
  onClose: () => void;
  onRecorded?: (result: RecordedTransaction) => void;
}) {
  const isSale = outcome === "Sold";
  const [salePrice, setSalePrice] = useState("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [monthlyRent, setMonthlyRent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string>("");
  const [manualName, setManualName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const { notify } = useToast();
  const sale = useRecordSale();
  const lease = useRecordLease();
  const pending = sale.isPending || lease.isPending;

  const enquiriesQuery = usePropertyEnquiries(property?.id);
  const isLoadingCandidates = enquiriesQuery.isLoading;
  // Primitive dependency so reopening the dialog for a different property
  // resets the form without depending on the whole object identity.
  const propertyId = property?.id;
  const propertyPrice = property?.price;

  // One row per interested person. The same client often enquires more than once,
  // and the backend takes a single enquiry id to attribute the deal, so offering
  // every duplicate would let the recorder pick between rows that mean the same
  // person. Registered users collapse on user id; walk-ins on email.
  const candidates = useMemo(() => {
    const items = enquiriesQuery.data?.items ?? [];
    const seen = new Map<string, Enquiry>();
    for (const enquiry of items) {
      const key = enquiry.userId ?? enquiry.email?.toLowerCase() ?? `enquiry-${enquiry.id}`;
      if (!seen.has(key)) seen.set(key, enquiry);
    }
    return [...seen.values()].sort((a, b) =>
      a.fullName.localeCompare(b.fullName),
    );
  }, [enquiriesQuery.data]);

  const selectedCandidate = candidates.find(
    (c) => String(c.id) === selectedEnquiryId,
  );

  // Picking an interested client prefills their name and whatever contact
  // details we hold. Email and phone remain editable because both are mandatory
  // on the record, and an enquiry may have been submitted without a phone.
  useEffect(() => {
    if (!selectedCandidate) return;
    setManualName(selectedCandidate.fullName);
    setClientEmail(selectedCandidate.email ?? "");
    setClientPhone(selectedCandidate.phone ?? "");
  }, [selectedCandidate]);

  // With interested clients on file, the counterparty has to be one of them: the
  // buyer's account is derived from the enquiry, so a typed-in name would create
  // a deal that cannot be traced back to a client account. A property nobody has
  // enquired about still has to be sellable, so manual entry is offered there.
  const requiresCandidate = candidates.length > 0;

  useEffect(() => {
    if (propertyId == null || outcome == null) return;
    setSelectedEnquiryId("");
    setManualName("");
    setClientEmail("");
    setClientPhone("");
    setNotes("");
    // The sale price is almost always the listing price, so it is pre-filled
    // from the property and only edited when the agreed figure differs.
    setSalePrice(
      propertyPrice != null && propertyPrice > 0 ? String(propertyPrice) : "",
    );
    setSaleDate(new Date().toISOString().slice(0, 10));
    setMonthlyRent("");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
  }, [propertyId, propertyPrice, outcome]);

  const counterpartyName = selectedCandidate?.fullName ?? manualName;

  // Both email and phone are mandatory on a recorded deal. The backend enforces
  // this too; checking here keeps the button disabled with an explanation rather
  // than letting the request fail after the fact.
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim());
  const missingCounterparty =
    counterpartyName.trim().length === 0 || !hasValidEmail || clientPhone.trim().length === 0;

  const canSubmit =
    !pending &&
    !missingCounterparty &&
    (isSale
      ? Number(salePrice) > 0 && Boolean(saleDate)
      : Number(monthlyRent) > 0 && Boolean(startDate) && Boolean(endDate));

  const submit = async () => {
    if (!property || outcome == null) return;
    try {
      const idempotencyKey = crypto.randomUUID();
      // The enquiry id is what attaches the counterparty's account to the record;
      // the name and contact are only the human-readable label for the report.
      const enquiryId = selectedCandidate ? selectedCandidate.id : null;
      if (isSale) {
        await sale.mutateAsync({
          propertyId: property.id,
          idempotencyKey,
          payload: {
            salePrice: Number(salePrice),
            saleDate,
            buyerName: counterpartyName,
            buyerEmail: clientEmail.trim(),
            buyerPhone: clientPhone.trim(),
            notes: notes,
            enquiryId,
          },
        });
      } else {
        await lease.mutateAsync({
          propertyId: property.id,
          idempotencyKey,
          payload: {
            tenantName: counterpartyName,
            tenantEmail: clientEmail.trim(),
            tenantPhone: clientPhone.trim(),
            monthlyRent: Number(monthlyRent),
            leaseStartDate: startDate,
            leaseEndDate: endDate,
            notes: notes || null,
            enquiryId,
          },
        });
      }
      notify({
        type: "success",
        title: isSale ? "Sale recorded" : "Rental recorded",
        description: `${property.title} is now marked ${isSale ? "sold" : "rented"}.`,
      });
      onRecorded?.({ outcome, counterpartyName });
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
      open={property != null && outcome != null}
      onClose={onClose}
      title={isSale ? "Record confirmed sale" : "Record confirmed rental"}
      description={
        property
          ? `${property.title} will be marked ${isSale ? "Sold" : "Rented"} once this is recorded.`
          : undefined
      }
    >
      <div className="space-y-4">
        <Select
          label={isSale ? "Buyer" : "Tenant"}
          value={selectedEnquiryId}
          onChange={(event) => setSelectedEnquiryId(event.target.value)}
          disabled={!requiresCandidate || isLoadingCandidates}
        >
          <option value="">
            {isLoadingCandidates
              ? "Loading interested clients…"
              : requiresCandidate
                ? "Select the client"
                : "No enquiries on this property"}
          </option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName} — {c.email}
              {c.userId ? "" : " (not registered)"}
            </option>
          ))}
        </Select>

        {requiresCandidate && !selectedCandidate && candidates.length > 0 && (
          <p className="text-xs text-ink-500">
            {candidates.length} {candidates.length === 1 ? "client has" : "clients have"}{" "}
            enquired about this property. Pick one so the sale is recorded against
            their account.
          </p>
        )}

        {!requiresCandidate && !isLoadingCandidates && (
          <>
            <p className="text-xs text-ink-500">
              Nobody has enquired about this property, so record the client
              manually. The deal will not be linked to a client account.
            </p>
            <Input
              label={isSale ? "Buyer name" : "Tenant name"}
              value={manualName}
              onChange={(event) => setManualName(event.target.value)}
              required
            />
          </>
        )}

        {/*
          Email and phone are required on every recorded deal, whether the client
          came from an enquiry or walked in. When a client is picked the fields
          prefill from their enquiry and stay editable.
        */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={isSale ? "Buyer email" : "Tenant email"}
            type="email"
            value={clientEmail}
            onChange={(event) => setClientEmail(event.target.value)}
            error={clientEmail.length > 0 && !hasValidEmail ? "Enter a valid email address" : undefined}
            required
          />
          <Input
            label={isSale ? "Buyer phone" : "Tenant phone"}
            type="tel"
            value={clientPhone}
            onChange={(event) => setClientPhone(event.target.value)}
            required
          />
        </div>

        {isSale ? (
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
          <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => void submit()}
            loading={pending}
            disabled={!canSubmit}
          >
            {isSale ? "Record sale" : "Record rental"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}