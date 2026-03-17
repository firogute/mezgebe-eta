import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import PaymentForm from "./PaymentForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CountdownText } from "@/components/ui/CountdownText";
import { VerifiedTicketDownload } from "@/components/tickets/VerifiedTicketDownload";
import { getTicketTemplateConfig } from "@/lib/ticketTemplate";
import { parsePaymentProof } from "@/lib/paymentProof";
import { LeulVerificationDetails } from "@/components/payments/LeulVerificationDetails";

export default async function PaymentPage({
  params,
}: {
  params: { reservationId: string };
}) {
  const { reservationId } = await params;

  const ticketTemplate = await getTicketTemplateConfig();

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      user: {
        select: {
          username: true,
        },
      },
      payment: true,
      tickets: {
        include: { event: true }, // We need event for calculating price
      },
    },
  });

  if (!reservation) {
    return notFound();
  }

  const event = reservation.tickets[0]?.event;
  if (!event) return notFound();

  const userPhoneRows = await prisma.$queryRawUnsafe<
    Array<{ phone: string | null }>
  >('SELECT "phone" FROM "User" WHERE "id" = $1 LIMIT 1', reservation.userId);
  const reservationPhone = userPhoneRows[0]?.phone || null;

  const ticketCount = reservation.tickets.length;
  const totalPrice = ticketCount * event.ticketPrice;
  const paymentProof = reservation.payment
    ? parsePaymentProof(reservation.payment.proofUrl)
    : null;

  if (
    reservation.status === "APPROVED" &&
    reservation.payment?.status === "VERIFIED"
  ) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <Link
          href="/receipt"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Receipts
        </Link>

        <section className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
            Payment Verified
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Your tickets are ready
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Your payment has already been approved. Download your ticket card as
            PNG or PDF below.
          </p>

          <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-muted/30 p-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Event</p>
              <p className="mt-2 font-semibold text-foreground">
                {event.title}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Tickets</p>
              <p className="mt-2 font-semibold text-foreground">
                {ticketCount}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Amount</p>
              <p className="mt-2 font-semibold text-primary">
                {totalPrice} Birr
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Phone</p>
              <p className="mt-2 font-semibold text-foreground">
                {reservationPhone || "Not available"}
              </p>
            </div>
          </div>

          {paymentProof?.verifier && (
            <div className="mt-4">
              <LeulVerificationDetails verifier={paymentProof.verifier} />
            </div>
          )}

          <div className="mt-6">
            <VerifiedTicketDownload
              eventTitle={event.title}
              username={reservation.user.username}
              phoneNumber={reservationPhone}
              ticketNumbers={reservation.tickets.map(
                (ticket) => ticket.ticketNumber,
              )}
              ticketPrice={event.ticketPrice}
              cutDate={reservation.createdAt}
              template={ticketTemplate}
            />
          </div>
        </section>
      </div>
    );
  }

  if (reservation.status !== "PENDING") {
    return (
      <div className="max-w-md mx-auto p-4 md:p-8 text-center">
        <div className="p-8 bg-card border border-border rounded-2xl">
          <h2 className="text-xl font-bold text-foreground mb-2">
            Invalid or Expired
          </h2>
          <p className="text-muted-foreground mb-6">
            Your reservation has likely expired after 24 hours.
          </p>
          <Link
            href="/"
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium"
          >
            Browse Raffles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Link>

      <div className="grid md:grid-cols-[0.95fr_1.05fr] gap-6">
        <section className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm h-fit">
          <h1 className="text-2xl font-bold text-foreground mb-5">
            Complete Payment
          </h1>

          <div className="bg-muted p-4 rounded-xl mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Reservation Expires In
              </span>
              <span className="text-sm font-bold text-red-500">
                <CountdownText
                  deadline={reservation.expiresAt}
                  showLabel={false}
                />
              </span>
            </div>
            <div className="border-t border-border/50"></div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground">{event.title}</span>
              <span className="text-muted-foreground">
                {ticketCount} Tickets
              </span>
            </div>
            <div className="flex justify-between items-end mt-1">
              <span className="text-sm text-muted-foreground">
                Total to pay
              </span>
              <span className="text-2xl font-bold text-primary">
                {totalPrice} Birr
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Phone Number</span>
              <span className="text-foreground font-medium">
                {reservationPhone || "Not available"}
              </span>
            </div>
          </div>

          {(event.bankType || event.accountName || event.accountNumber) && (
            <div className="rounded-xl border border-border bg-card/60 p-4 mb-6">
              <p className="text-xs uppercase text-muted-foreground tracking-wide mb-3">
                Payment Destination
              </p>
              <div className="space-y-2 text-sm">
                {event.bankType && (
                  <p>
                    <span className="text-muted-foreground">Bank Type:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {event.bankType}
                    </span>
                  </p>
                )}
                {event.accountName && (
                  <p>
                    <span className="text-muted-foreground">Account Name:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {event.accountName}
                    </span>
                  </p>
                )}
                {event.accountNumber && (
                  <p>
                    <span className="text-muted-foreground">
                      Account Number:
                    </span>{" "}
                    <span className="font-semibold text-foreground tracking-wide">
                      {event.accountNumber}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase text-muted-foreground tracking-wide mb-2">
              Payment Status Guide
            </p>
            <div className="space-y-1.5 text-sm">
              <p>
                <span className="font-semibold text-yellow-700">Pending:</span>{" "}
                waiting for admin verification.
              </p>
              <p>
                <span className="font-semibold text-green-700">Verified:</span>{" "}
                payment approved and tickets confirmed.
              </p>
              <p>
                <span className="font-semibold text-red-700">Rejected:</span>{" "}
                proof failed verification, update payment.
              </p>
            </div>
          </div>

          {paymentProof?.verifier && (
            <div className="mt-6">
              <LeulVerificationDetails verifier={paymentProof.verifier} />
            </div>
          )}
        </section>

        <section className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <PaymentForm
            reservationId={reservationId}
            username={reservation.user.username}
            initialPhone={reservationPhone}
          />
        </section>
      </div>
    </div>
  );
}
