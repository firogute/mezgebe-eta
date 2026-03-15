import Link from "next/link";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AdminTicketDetailPage({
  params,
}: {
  params: { ticketId: string };
}) {
  const { ticketId } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      event: true,
      reservation: {
        include: {
          user: true,
          payment: true,
        },
      },
    },
  });

  if (!ticket) {
    return notFound();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-foreground">Ticket Details</h1>
        <Link
          href="/admin"
          className="px-4 py-2 rounded-md border border-border hover:bg-muted text-sm"
        >
          Back To Dashboard
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Ticket Number</p>
            <p className="font-mono font-medium">{ticket.ticketNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ticket Status</p>
            <p className="font-medium">{ticket.status}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Event</p>
            <p className="font-medium">{ticket.event.title}</p>
          </div>
          <div>
            <p className="text-muted-foreground">How Much</p>
            <p className="font-medium">{ticket.event.ticketPrice} Birr</p>
          </div>
          <div>
            <p className="text-muted-foreground">Who Cut</p>
            <p className="font-medium">
              {ticket.reservation?.user?.username
                ? `@${ticket.reservation.user.username}`
                : "Not assigned"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Phone Number</p>
            <p className="font-medium">
              {ticket.reservation?.user?.phone || "Not available"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Reservation Status</p>
            <p className="font-medium">
              {ticket.reservation?.status || "NO RESERVATION"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Payment Status</p>
            <p className="font-medium">
              {ticket.reservation?.payment?.status || "NO PAYMENT"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Payment Method</p>
            <p className="font-medium">
              {ticket.reservation?.payment?.method || "-"}
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4 text-sm text-muted-foreground space-y-1">
          <p>Created: {new Date(ticket.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(ticket.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
