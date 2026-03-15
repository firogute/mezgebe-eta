import prisma from "@/lib/prisma";
import { PaymentApprovalButtons } from "./components/PaymentApprovalButtons";
import { parsePaymentProof } from "@/lib/paymentProof";
import { ReceiptImageViewer } from "./components/ReceiptImageViewer";

export const dynamic = "force-dynamic";

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
                          <a
                            href={parsedProof.referenceLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline break-all text-sm"
                          >
                            {parsedProof.referenceLink}
                          </a>
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
