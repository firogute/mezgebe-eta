import Link from "next/link";
import prisma from "@/lib/prisma";
import { EtaEventActions } from "./components/EtaEventActions";
import Image from "next/image";
import { CountdownText } from "@/components/ui/CountdownText";

export default async function AdminDashboard() {
  // Fetch Analytics
  const [totalEvents, totalUsers, pendingPayments, soldTickets] =
    await Promise.all([
      prisma.etaEvent.count(),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.reservation.count({
        where: { status: "PENDING", payment: { isNot: null } },
      }),
      prisma.ticket.count({ where: { status: "SOLD" } }),
    ]);

  const activeEvents = await prisma.etaEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      tickets: {
        select: {
          status: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Events
          </h3>
          <p className="text-3xl font-bold text-primary mt-2">{totalEvents}</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-medium text-muted-foreground">
            Tickets Sold
          </h3>
          <p className="text-3xl font-bold text-primary mt-2">{soldTickets}</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-medium text-muted-foreground">
            Pending Payouts
          </h3>
          <p className="text-3xl font-bold text-accent mt-2">
            {pendingPayments}
          </p>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Users
          </h3>
          <p className="text-3xl font-bold text-primary mt-2">{totalUsers}</p>
        </div>
      </div>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Active Eta / Ixa Events
        </h2>
        {activeEvents.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-xl text-muted-foreground">
            No events found.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeEvents.map((event) => {
              const soldCount = event.tickets.filter(
                (ticket) => ticket.status === "SOLD",
              ).length;
              const reservedCount = event.tickets.filter(
                (ticket) => ticket.status === "RESERVED",
              ).length;
              const availableCount = event.tickets.filter(
                (ticket) => ticket.status === "AVAILABLE",
              ).length;

              return (
                <article
                  key={event.id}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="grid md:grid-cols-[160px_1fr] gap-0">
                    <div className="relative h-40 md:h-full bg-muted">
                      {event.image ? (
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-3xl text-primary/40">
                          🎟️
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/admin/eta/${event.id}`}
                            className="text-lg font-semibold text-primary hover:underline"
                          >
                            {event.title}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {event.descriptionEn}
                          </p>
                        </div>
                        <span className="text-xs rounded-full px-2 py-1 bg-primary/10 text-primary font-semibold">
                          {event.ticketPrice} Birr
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg border border-border p-2">
                          <p className="text-muted-foreground">Available</p>
                          <p className="font-semibold text-primary mt-1">
                            {availableCount}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border p-2">
                          <p className="text-muted-foreground">Reserved</p>
                          <p className="font-semibold text-accent mt-1">
                            {reservedCount}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border p-2">
                          <p className="text-muted-foreground">Sold</p>
                          <p className="font-semibold mt-1">{soldCount}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          <CountdownText deadline={event.deadline} />
                        </p>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/eta/${event.id}`}
                            className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                          >
                            Open Analytics
                          </Link>
                          <EtaEventActions eventId={event.id} compact />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
