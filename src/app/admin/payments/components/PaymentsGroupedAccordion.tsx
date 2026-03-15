"use client";

import { useMemo, useState } from "react";
import { PaymentApprovalButtons } from "./PaymentApprovalButtons";
import { ReceiptImageViewer } from "./ReceiptImageViewer";
import { ReferenceLinkPreview } from "./ReferenceLinkPreview";
import type { PaymentProofData } from "@/lib/paymentProof";

export type PaymentRowData = {
  id: string;
  username: string;
  phone: string | null;
  method: string;
  ticketNumbers: string[];
  createdAt: string;
  updatedAt: string;
  proof: {
    receiptImageUrl: string | null;
    referenceLink: string | null;
    verifier: PaymentProofData["verifier"] | null;
  };
};

export type PaymentGroupData = {
  eventId: string;
  eventTitle: string;
  payments: PaymentRowData[];
};

function formatMoney(
  amount: number | null | undefined,
  currency?: string | null,
) {
  if (typeof amount !== "number") {
    return null;
  }

  return `${amount.toLocaleString()} ${currency || "Birr"}`;
}

function extractPaidTime(paymentDate: string | null | undefined) {
  if (!paymentDate) {
    return null;
  }

  const trimmed = paymentDate.trim();
  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return parts.slice(1).join(" ");
  }

  const isoDate = new Date(trimmed);
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate.toLocaleTimeString();
  }

  return null;
}

function LeulDetails({
  verifier,
}: {
  verifier: PaymentProofData["verifier"] | null;
}) {
  const paidTime = extractPaidTime(verifier?.paymentDate);

  if (!verifier?.verifiedPaid) {
    return <p className="text-sm font-medium text-red-600">X Not Verified</p>;
  }

  return (
    <div className="text-sm">
      <div className="space-y-2 md:hidden">
        <p>
          <span className="text-muted-foreground">Status:</span>{" "}
          {verifier.statusText || "Verified"}
        </p>
        {verifier.payerName && (
          <p>
            <span className="text-muted-foreground">Payer:</span>{" "}
            {verifier.payerName}
          </p>
        )}
        {formatMoney(verifier.verifiedAmount, verifier.verifiedCurrency) && (
          <p>
            <span className="text-muted-foreground">Amount:</span>{" "}
            {formatMoney(verifier.verifiedAmount, verifier.verifiedCurrency)}
          </p>
        )}
        <p>
          <span className="text-muted-foreground">Time Paid:</span>{" "}
          {paidTime || "Not available"}
        </p>
        {verifier.verifierReference && (
          <p>
            <span className="text-muted-foreground">Reference:</span>{" "}
            {verifier.verifierReference}
          </p>
        )}
      </div>

      <div className="hidden gap-2 md:grid md:grid-cols-2">
        <p>
          <span className="text-muted-foreground">Provider:</span>{" "}
          {verifier.provider || "Leul"}
        </p>
        <p>
          <span className="text-muted-foreground">Status:</span>{" "}
          {verifier.statusText || "Verified"}
        </p>
        {verifier.payerName && (
          <p>
            <span className="text-muted-foreground">Payer Name:</span>{" "}
            {verifier.payerName}
          </p>
        )}
        {verifier.payerAccount && (
          <p>
            <span className="text-muted-foreground">Payer Account:</span>{" "}
            {verifier.payerAccount}
          </p>
        )}
        {verifier.creditedPartyName && (
          <p>
            <span className="text-muted-foreground">Receiver:</span>{" "}
            {verifier.creditedPartyName}
          </p>
        )}
        {verifier.creditedPartyAccount && (
          <p>
            <span className="text-muted-foreground">Receiver Account:</span>{" "}
            {verifier.creditedPartyAccount}
          </p>
        )}
        {formatMoney(verifier.verifiedAmount, verifier.verifiedCurrency) && (
          <p>
            <span className="text-muted-foreground">Settled Amount:</span>{" "}
            {formatMoney(verifier.verifiedAmount, verifier.verifiedCurrency)}
          </p>
        )}
        {formatMoney(verifier.serviceFee, verifier.verifiedCurrency) && (
          <p>
            <span className="text-muted-foreground">Service Fee:</span>{" "}
            {formatMoney(verifier.serviceFee, verifier.verifiedCurrency)}
          </p>
        )}
        {formatMoney(verifier.totalPaidAmount, verifier.verifiedCurrency) && (
          <p>
            <span className="text-muted-foreground">Total Paid:</span>{" "}
            {formatMoney(verifier.totalPaidAmount, verifier.verifiedCurrency)}
          </p>
        )}
        {verifier.paymentDate && (
          <p>
            <span className="text-muted-foreground">Payment Date:</span>{" "}
            {verifier.paymentDate}
          </p>
        )}
        <p>
          <span className="text-muted-foreground">Time Paid:</span>{" "}
          {paidTime || "Not available for this saved payment"}
        </p>
        {verifier.verifierReference && (
          <p>
            <span className="text-muted-foreground">Reference:</span>{" "}
            {verifier.verifierReference}
          </p>
        )}
      </div>
    </div>
  );
}

function PaymentSection({
  title,
  groups,
  emptyMessage,
  approved,
}: {
  title: string;
  groups: PaymentGroupData[];
  emptyMessage: string;
  approved: boolean;
}) {
  const [openPaymentId, setOpenPaymentId] = useState<string | null>(null);

  const allPaymentsCount = useMemo(
    () => groups.reduce((total, group) => total + group.payments.length, 0),
    [groups],
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {allPaymentsCount > 0 && (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {allPaymentsCount} payment{allPaymentsCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.eventId}
              className="rounded-2xl border border-border bg-card"
            >
              <div className="border-b border-border px-4 py-3 md:px-5">
                <h3 className="font-semibold text-foreground">
                  {group.eventTitle}
                </h3>
              </div>

              <div className="px-3 py-2 md:px-4">
                <div className="hidden grid-cols-[1.1fr_0.8fr_1.1fr_0.7fr_0.8fr_0.6fr] gap-3 border-b border-border px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                  <span>User</span>
                  <span>Method</span>
                  <span>Tickets</span>
                  <span>Leul</span>
                  <span>Time Paid</span>
                  <span className="text-right">Action</span>
                </div>

                {group.payments.map((payment) => {
                  const verified = payment.proof.verifier?.verifiedPaid;
                  const paidTime = extractPaidTime(
                    payment.proof.verifier?.paymentDate,
                  );
                  const isOpen = openPaymentId === payment.id;

                  return (
                    <div
                      key={payment.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenPaymentId((current) =>
                            current === payment.id ? null : payment.id,
                          )
                        }
                        className="grid w-full grid-cols-1 gap-2 px-2 py-3 text-left hover:bg-muted/40 md:grid-cols-[1.1fr_0.8fr_1.1fr_0.7fr_0.8fr_0.6fr] md:items-center md:gap-3"
                      >
                        <div className="md:hidden flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">
                              @{payment.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payment.phone || "No phone"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payment.method} • {payment.ticketNumbers.length}{" "}
                              ticket
                              {payment.ticketNumbers.length === 1 ? "" : "s"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-xs font-semibold ${
                                verified ? "text-green-700" : "text-red-600"
                              }`}
                            >
                              {verified ? "Verified" : "Not Verified"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {paidTime || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="hidden md:block">
                          <p className="font-medium text-foreground">
                            @{payment.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.phone || "No phone"}
                          </p>
                        </div>
                        <p className="hidden text-sm text-foreground md:block">
                          {payment.method}
                        </p>
                        <p className="hidden text-sm text-foreground md:block">
                          {payment.ticketNumbers.join(", ")}
                        </p>
                        <p
                          className={`hidden text-sm font-medium md:block ${
                            verified ? "text-green-700" : "text-red-600"
                          }`}
                        >
                          {verified ? "Verified" : "Not Verified"}
                        </p>
                        <p className="hidden text-sm text-foreground md:block">
                          {paidTime || "-"}
                        </p>
                        <p className="text-sm text-right text-primary">
                          {isOpen ? "Collapse" : "Expand"}
                        </p>
                      </button>

                      {isOpen && (
                        <div className="space-y-4 bg-muted/20 px-3 py-4 md:px-4">
                          <div className="rounded-xl border border-border bg-background p-4">
                            <p className="mb-3 text-sm font-semibold text-foreground">
                              Leul Verification Details
                            </p>
                            <LeulDetails verifier={payment.proof.verifier} />
                          </div>

                          {(payment.proof.receiptImageUrl ||
                            payment.proof.referenceLink) && (
                            <div className="grid gap-4 lg:grid-cols-2">
                              {payment.proof.receiptImageUrl && (
                                <div className="rounded-xl border border-border bg-background p-4">
                                  <p className="mb-2 text-sm font-medium text-foreground">
                                    Uploaded Receipt Image
                                  </p>
                                  <ReceiptImageViewer
                                    imageUrl={payment.proof.receiptImageUrl}
                                  />
                                </div>
                              )}

                              {payment.proof.referenceLink && (
                                <div className="rounded-xl border border-border bg-background p-4">
                                  <p className="mb-2 text-sm font-medium text-foreground">
                                    Bank/Reference Link
                                  </p>
                                  <ReferenceLinkPreview
                                    referenceLink={payment.proof.referenceLink}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {!approved && (
                            <div className="pt-1">
                              <PaymentApprovalButtons paymentId={payment.id} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function PaymentsGroupedAccordion({
  pendingGroups,
  approvedGroups,
}: {
  pendingGroups: PaymentGroupData[];
  approvedGroups: PaymentGroupData[];
}) {
  return (
    <div className="space-y-6">
      <PaymentSection
        title="Pending Payments"
        groups={pendingGroups}
        emptyMessage="No pending payments to review."
        approved={false}
      />

      <PaymentSection
        title="Approved Payments"
        groups={approvedGroups}
        emptyMessage="No approved payments found yet."
        approved
      />
    </div>
  );
}
