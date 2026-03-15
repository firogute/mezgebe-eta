import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { parsePaymentProof } from "@/lib/paymentProof";
import {
  PaymentsGroupedAccordion,
  type PaymentGroupData,
  type PaymentRowData,
} from "./components/PaymentsGroupedAccordion";

export const dynamic = "force-dynamic";

type PaymentWithReservation = Prisma.PaymentGetPayload<{
  include: {
    reservation: {
      include: {
        user: true;
        tickets: {
          include: {
            event: {
              select: {
                id: true;
                title: true;
              };
            };
          };
        };
      };
    };
  };
}>;

function toRowData(payments: PaymentWithReservation[]): PaymentRowData[] {
  return payments.map((payment) => {
    const parsedProof = parsePaymentProof(payment.proofUrl);
    const firstTicketWithEvent = payment.reservation.tickets.find((ticket) =>
      Boolean(ticket.event),
    );

    return {
      id: payment.id,
      eventId: firstTicketWithEvent?.event?.id || "unknown-event",
      eventTitle: firstTicketWithEvent?.event?.title || "Unknown ETA Event",
      username: payment.reservation.user.username,
      phone: payment.reservation.user.phone || null,
      method: payment.method,
      ticketNumbers: payment.reservation.tickets.map(
        (ticket) => ticket.ticketNumber,
      ),
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      proof: parsedProof,
    };
  });
}

function groupByEvent(payments: PaymentRowData[]): PaymentGroupData[] {
  const grouped = new Map<string, PaymentGroupData>();

  for (const payment of payments) {
    const existing = grouped.get(payment.eventId);
    if (existing) {
      existing.payments.push(payment);
      continue;
    }

    grouped.set(payment.eventId, {
      eventId: payment.eventId,
      eventTitle: payment.eventTitle,
      payments: [payment],
    });
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.eventTitle.localeCompare(b.eventTitle),
  );
}

export default async function PaymentsPage() {
  const [pendingPayments, approvedPayments] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "PENDING" },
      include: {
        reservation: {
          include: {
            user: true,
            tickets: {
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { status: "VERIFIED" },
      include: {
        reservation: {
          include: {
            user: true,
            tickets: {
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const pendingGroups = groupByEvent(toRowData(pendingPayments));
  const approvedGroups = groupByEvent(toRowData(approvedPayments));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">
        Payment Verification
      </h1>
      <PaymentsGroupedAccordion
        pendingGroups={pendingGroups}
        approvedGroups={approvedGroups}
      />
    </div>
  );
}
