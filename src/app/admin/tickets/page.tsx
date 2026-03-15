import prisma from "@/lib/prisma";
import { TicketManagementTable } from "./components/TicketManagementTable";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      event: {
        select: {
          title: true,
        },
      },
      reservation: {
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  const tableRows = tickets.map((ticket) => ({
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    status: ticket.status,
    eventTitle: ticket.event.title,
    username: ticket.reservation?.user.username || null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Tickets Management
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Organized by event with search and filters for simpler day-to-day
          management.
        </p>
      </div>

      {tableRows.length === 0 ? (
        <div className="p-8 text-center bg-card border border-border rounded-xl text-muted-foreground">
          No tickets found.
        </div>
      ) : (
        <TicketManagementTable tickets={tableRows} />
      )}
    </div>
  );
}
