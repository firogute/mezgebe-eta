import prisma from "@/lib/prisma";
import { PaymentApprovalButtons } from "./components/PaymentApprovalButtons";
import { parsePaymentProof } from "@/lib/paymentProof";
import { ReceiptImageViewer } from "./components/ReceiptImageViewer";
import { ReferenceLinkPreview } from "./components/ReferenceLinkPreview";

export const dynamic = "force-dynamic";

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

export default async function PaymentsPage() {
  const pendingPayments = await prisma.payment.findMany({
    where: { status: "PENDING" },
    include: {
      reservation: {
        include: {
          user: true,
          tickets: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">
        Payment Verification
      </h1>

      {pendingPayments.length === 0 ? (
        <div className="p-8 text-center bg-card border border-border rounded-xl text-muted-foreground">
          No pending payments to review.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pendingPayments.map((payment) =>
            (() => {
              const parsedProof = parsePaymentProof(payment.proofUrl);
              const paidTime = extractPaidTime(parsedProof.verifier?.paymentDate);

              return (
                <div
                  key={payment.id}
                  className="bg-card border border-border rounded-xl p-6 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        @{payment.reservation.user.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {payment.reservation.tickets.length} tickets reserved
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      Pending
                    </span>
                  </div>

                  <div className="mb-4 text-sm space-y-2">
                    <p>
                      <span className="text-muted-foreground">Method:</span>{" "}
                      {payment.method}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Tickets:</span>{" "}
                      {payment.reservation.tickets
                        .map((t) => t.ticketNumber)
                        .join(", ")}
                    </p>
                  </div>

                  <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
                    <p className="mb-3 text-sm font-medium text-foreground">
                      Leul Verification
                    </p>

                    {parsedProof.verifier?.verifiedPaid ? (
                      <div className="space-y-2 text-sm">
                        <p className="font-medium text-green-700">Verified</p>
                        <p>
                          <span className="text-muted-foreground">
                            Provider:
                          </span>{" "}
                          {parsedProof.verifier.provider || "Leul"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Status:</span>{" "}
                          {parsedProof.verifier.statusText || "Verified"}
                        </p>
                        {parsedProof.verifier.payerName && (
                          <p>
                            <span className="text-muted-foreground">
                              Payer Name:
                            </span>{" "}
                            {parsedProof.verifier.payerName}
                          </p>
                        )}
                        {parsedProof.verifier.payerAccount && (
                          <p>
                            <span className="text-muted-foreground">
                              Payer Account:
                            </span>{" "}
                            {parsedProof.verifier.payerAccount}
                          </p>
                        )}
                        {parsedProof.verifier.creditedPartyName && (
                          <p>
                            <span className="text-muted-foreground">
                              Receiver:
                            </span>{" "}
                            {parsedProof.verifier.creditedPartyName}
                          </p>
                        )}
                        {parsedProof.verifier.creditedPartyAccount && (
                          <p>
                            <span className="text-muted-foreground">
                              Receiver Account:
                            </span>{" "}
                            {parsedProof.verifier.creditedPartyAccount}
                          </p>
                        )}
                        {formatMoney(
                          parsedProof.verifier.verifiedAmount,
                          parsedProof.verifier.verifiedCurrency,
                        ) && (
                          <p>
                            <span className="text-muted-foreground">
                              Settled Amount:
                            </span>{" "}
                            {formatMoney(
                              parsedProof.verifier.verifiedAmount,
                              parsedProof.verifier.verifiedCurrency,
                            )}
                          </p>
                        )}
                        {formatMoney(
                          parsedProof.verifier.serviceFee,
                          parsedProof.verifier.verifiedCurrency,
                        ) && (
                          <p>
                            <span className="text-muted-foreground">
                              Service Fee:
                            </span>{" "}
                            {formatMoney(
                              parsedProof.verifier.serviceFee,
                              parsedProof.verifier.verifiedCurrency,
                            )}
                          </p>
                        )}
                        {formatMoney(
                          parsedProof.verifier.totalPaidAmount,
                          parsedProof.verifier.verifiedCurrency,
                        ) && (
                          <p>
                            <span className="text-muted-foreground">
                              Total Paid:
                            </span>{" "}
                            {formatMoney(
                              parsedProof.verifier.totalPaidAmount,
                              parsedProof.verifier.verifiedCurrency,
                            )}
                          </p>
                        )}
                        {parsedProof.verifier.paymentDate && (
                          <p>
                            <span className="text-muted-foreground">
                              Payment Date:
                            </span>{" "}
                            {parsedProof.verifier.paymentDate}
                          </p>
                        )}
                        <p>
                          <span className="text-muted-foreground">
                            Time Paid:
                          </span>{" "}
                          {paidTime || "Not available for this saved payment"}
                        </p>
                        {parsedProof.verifier.verifierReference && (
                          <p>
                            <span className="text-muted-foreground">
                              Reference:
                            </span>{" "}
                            {parsedProof.verifier.verifierReference}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-red-600">
                        X Not Verified
                      </p>
                    )}
                  </div>

                  {(parsedProof.receiptImageUrl ||
                    parsedProof.referenceLink) && (
                    <div className="mb-6">
                      {parsedProof.receiptImageUrl && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">
                            Uploaded Receipt Image:
                          </p>
                          <ReceiptImageViewer
                            imageUrl={parsedProof.receiptImageUrl}
                          />
                        </div>
                      )}

                      {parsedProof.referenceLink && (
                        <div>
                          <p className="text-sm font-medium mb-2">
                            Bank/Reference Link:
                          </p>
                          <ReferenceLinkPreview
                            referenceLink={parsedProof.referenceLink}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <PaymentApprovalButtons paymentId={payment.id} />
                </div>
              );
            })(),
          )}
        </div>
      )}
    </div>
  );
}
