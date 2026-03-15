import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { EtaEventActions } from "../../components/EtaEventActions";
import Image from "next/image";
import { CountdownText } from "@/components/ui/CountdownText";

export default async function AdminEtaDetailPage({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = await params;

  const event = await prisma.etaEvent.findUnique({
    where: { id: eventId },
    include: {
      tickets: {
        orderBy: { createdAt: "asc" },
        include: {
          reservation: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
              payment: {
                select: {
                  status: true,
                  method: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!event) {
    return notFound();
  }

  const soldCount = event.tickets.filter(
    (ticket) => ticket.status === "SOLD",
  ).length;
  const reservedCount = event.tickets.filter(
    (ticket) => ticket.status === "RESERVED",
  ).length;
  const availableCount = event.tickets.filter(
    (ticket) => ticket.status === "AVAILABLE",
  ).length;
  const occupancyRate =
    event.totalTickets === 0
      ? 0
      : Math.round((soldCount / event.totalTickets) * 100);
  const engagementRate =
    event.totalTickets === 0
      ? 0
      : Math.round(((soldCount + reservedCount) / event.totalTickets) * 100);

  const reservations = Array.from(
    new Map(
      event.tickets
        .filter((ticket) => ticket.reservation)
        .map((ticket) => [ticket.reservation!.id, ticket.reservation!]),
    ).values(),
  );

  const pendingReservations = reservations.filter(
    (reservation) => reservation.status === "PENDING",
  ).length;
  const approvedReservations = reservations.filter(
    (reservation) => reservation.status === "APPROVED",
  ).length;
  const rejectedReservations = reservations.filter(
    (reservation) => reservation.status === "REJECTED",
  ).length;
  const expiredReservations = reservations.filter(
    (reservation) => reservation.status === "EXPIRED",
  ).length;

  const payments = reservations
    .map((reservation) => reservation.payment)
    .filter((payment) => payment !== null);

  const pendingPayments = payments.filter(
    (payment) => payment.status === "PENDING",
  ).length;
  const verifiedPayments = payments.filter(
    (payment) => payment.status === "VERIFIED",
  ).length;
  const rejectedPayments = payments.filter(
    (payment) => payment.status === "REJECTED",
  ).length;

  const verifiedRevenue = soldCount * event.ticketPrice;
  const pipelineRevenue = (soldCount + reservedCount) * event.ticketPrice;

  const topBuyers = Array.from(
    reservations
      .reduce((map, reservation) => {
        const username = reservation.user.username;
        const current = map.get(username) || {
          username,
          tickets: 0,
          latestActivity: reservation.createdAt,
        };

        current.tickets += reservation.tickets.length;
        if (reservation.createdAt > current.latestActivity) {
          current.latestActivity = reservation.createdAt;
        }

        map.set(username, current);
        return map;
      }, new Map<string, { username: string; tickets: number; latestActivity: Date }>())
      .values(),
  )
    .sort((left, right) => right.tickets - left.tickets)
    .slice(0, 5);

  const recentActivity = reservations
    .slice()
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 6);

  const paymentMethodBreakdown = Array.from(
    payments.reduce((map, payment) => {
      map.set(payment.method, (map.get(payment.method) || 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((left, right) => right[1] - left[1]);

  const statusBars = [
    {
      label: "Sold",
      count: soldCount,
      color: "bg-primary",
    },
    {
      label: "Reserved",
      count: reservedCount,
      color: "bg-accent",
    },
    {
      label: "Available",
      count: availableCount,
      color: "bg-muted-foreground/30",
    },
  ].map((item) => ({
    ...item,
    width:
      event.totalTickets === 0
        ? 0
        : Math.max(6, Math.round((item.count / event.totalTickets) * 100)),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
            Event Analytics
          </p>
          <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Performance snapshot for this ETA event based on live ticket,
            reservation, and payment activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            Back To Dashboard
          </Link>
          <EtaEventActions eventId={event.id} />
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
            <div className="relative min-h-72 bg-muted">
              {event.image ? (
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl text-primary/30">
                  ETA
                </div>
              )}
            </div>
            <div className="space-y-5 p-6">
              <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <CountdownText deadline={event.deadline} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <p className="text-xs uppercase text-muted-foreground">
                    Ticket Price
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {event.ticketPrice} Birr
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <p className="text-xs uppercase text-muted-foreground">
                    Capacity
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {event.totalTickets}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <p className="text-xs uppercase text-muted-foreground">
                    Verified Revenue
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-primary">
                    {verifiedRevenue.toLocaleString()} Birr
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <p className="text-xs uppercase text-muted-foreground">
                    Revenue Pipeline
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-accent">
                    {pipelineRevenue.toLocaleString()} Birr
                  </p>
                </div>
              </div>
              <div className="space-y-2 rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Occupancy</span>
                  <span className="font-semibold text-foreground">
                    {occupancyRate}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Engagement</span>
                  <span className="font-semibold text-foreground">
                    {engagementRate}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${engagementRate}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Description
                </p>
                <p className="mt-2 text-sm leading-7 text-foreground/85">
                  {event.descriptionEn}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Ticket Distribution
            </h2>
            <div className="mt-4 space-y-4">
              {statusBars.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold text-foreground">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`${item.color} h-full rounded-full`}
                      style={{ width: `${item.width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Reservation Health
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-muted-foreground">Pending</p>
                <p className="mt-2 text-2xl font-semibold">
                  {pendingReservations}
                </p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-muted-foreground">Approved</p>
                <p className="mt-2 text-2xl font-semibold text-primary">
                  {approvedReservations}
                </p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-muted-foreground">Rejected</p>
                <p className="mt-2 text-2xl font-semibold text-red-600">
                  {rejectedReservations}
                </p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-muted-foreground">Expired</p>
                <p className="mt-2 text-2xl font-semibold text-amber-600">
                  {expiredReservations}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Payment Verification
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl border border-border p-4">
              <span className="text-muted-foreground">Pending Review</span>
              <span className="text-xl font-semibold">{pendingPayments}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border p-4">
              <span className="text-muted-foreground">Verified</span>
              <span className="text-xl font-semibold text-primary">
                {verifiedPayments}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border p-4">
              <span className="text-muted-foreground">Rejected</span>
              <span className="text-xl font-semibold text-red-600">
                {rejectedPayments}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Top Buyers</h2>
          <div className="mt-4 space-y-3">
            {topBuyers.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                No buyer activity for this event yet.
              </p>
            ) : (
              topBuyers.map((buyer, index) => (
                <div
                  key={buyer.username}
                  className="flex items-center justify-between rounded-2xl border border-border p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {index + 1}. @{buyer.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last activity{" "}
                      {new Date(buyer.latestActivity).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-primary">
                    {buyer.tickets}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Payment Methods
          </h2>
          <div className="mt-4 space-y-3">
            {paymentMethodBreakdown.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                No payment methods recorded yet.
              </p>
            ) : (
              paymentMethodBreakdown.map(([method, count]) => (
                <div
                  key={method}
                  className="flex items-center justify-between rounded-2xl border border-border p-4 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {method.replaceAll("_", " ")}
                  </span>
                  <span className="font-semibold text-primary">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Recent Reservation Activity
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Latest reservation and payment movement for this event.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {reservations.length} reservations
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {recentActivity.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground lg:col-span-2">
              No reservation activity has been recorded for this ETA yet.
            </p>
          ) : (
            recentActivity.map((reservation) => (
              <div
                key={reservation.id}
                className="rounded-2xl border border-border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      @{reservation.user.username}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {reservation.tickets.length} ticket
                      {reservation.tickets.length === 1 ? "" : "s"} reserved on{" "}
                      {new Date(reservation.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {reservation.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-muted-foreground">Payment</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {reservation.payment?.status || "NO PAYMENT"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-muted-foreground">Method</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {reservation.payment?.method?.replaceAll("_", " ") || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
