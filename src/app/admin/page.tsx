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

  const metricCards = [
    {
      label: "Total Events",
      value: totalEvents,
      tone: "from-primary/20 to-primary/5",
      glow: "bg-primary/20",
      icon: "EV",
    },
    {
      label: "Tickets Sold",
      value: soldTickets,
      tone: "from-accent/25 to-accent/5",
      glow: "bg-accent/20",
      icon: "SL",
    },
    {
      label: "Pending Payouts",
      value: pendingPayments,
      tone: "from-amber-200/40 to-amber-100/10 dark:from-amber-300/10 dark:to-amber-100/5",
      glow: "bg-amber-300/20",
      icon: "PD",
    },
    {
      label: "Total Users",
      value: totalUsers,
      tone: "from-sky-200/35 to-sky-100/10 dark:from-sky-300/10 dark:to-sky-100/5",
      glow: "bg-sky-300/20",
      icon: "US",
    },
  ];

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card px-5 py-6 shadow-sm md:px-7 md:py-8">
        <div className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-16 h-44 w-44 rounded-full bg-accent/10 blur-2xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary/70">
              Command Center
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Admin Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Fast view of performance and direct actions for active ETA events.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/create-eta"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Create Event
            </Link>
            <Link
              href="/admin/payments"
              className="rounded-full border border-border bg-background/70 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Review Payments
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <article
            key={metric.label}
            className={`relative overflow-hidden rounded-2xl border border-border bg-linear-to-br ${metric.tone} p-5`}
          >
            <div
              className={`absolute -right-6 -top-7 h-20 w-20 rounded-full blur-2xl ${metric.glow}`}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {metric.value}
                </p>
              </div>
              <span className="inline-flex rounded-lg border border-border bg-background/80 px-2 py-1 text-[10px] font-bold text-primary">
                {metric.icon}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Active Eta / Ixa Events
          </h2>
          <p className="text-xs text-muted-foreground">
            Open analytics or manage each event from here.
          </p>
        </div>

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
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
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
                        <p className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                          <CountdownText deadline={event.deadline} />
                        </p>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/eta/${event.id}`}
                            className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                          >
                            Open Analytics
                          </Link>
                          <EtaEventActions
                            eventId={event.id}
                            eventStatus={event.status}
                            compact
                          />
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
