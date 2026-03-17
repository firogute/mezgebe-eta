import prisma from "@/lib/prisma";
import Link from "next/link";
import { releaseExpiredReservations } from "@/lib/actions/reservation";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CountdownText } from "@/components/ui/CountdownText";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await releaseExpiredReservations();

  const recentEvents = await prisma.etaEvent.findMany({
    include: {
      _count: {
        select: {
          tickets: { where: { status: "AVAILABLE" } },
        },
      },
      tickets: {
        where: { status: "WINNER" },
        take: 3,
        include: {
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
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-4 md:p-8">
      <header className="rounded-3xl border border-border bg-card/60 px-4 py-5 shadow-sm backdrop-blur-sm sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl md:text-4xl">
              Mezgebe Eta
            </h1>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:w-auto md:min-w-88">
            <ThemeToggle className="w-full" />
            <Link
              href="/receipt"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-muted"
            >
              Check My Receipt
            </Link>
          </div>
        </div>
      </header>

      <main>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-semibold">Recent Raffles</h2>
          <p className="text-sm text-muted-foreground sm:text-right">
            Showing latest 10 events. Tap a card for details or winners.
          </p>
        </div>

        {recentEvents.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-12 text-center">
            <p className="text-muted-foreground">
              No raffles available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recentEvents.map((event) => {
              const availableTickets = event._count.tickets;
              const isSoldOut = availableTickets === 0;
              const isExpired = new Date(event.deadline) < new Date();
              const isEnded =
                isExpired ||
                event.status === "ENDED" ||
                event.status === "LOTTERY_COMPLETED";
              const winners = event.tickets
                .map((ticket) => ticket.reservation?.user?.username)
                .filter((value): value is string => Boolean(value));

              return (
                <Link key={event.id} href={`/eta/${event.id}`}>
                  <article
                    className={
                      "group h-full overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg " +
                      (isSoldOut || isEnded ? "opacity-80" : "")
                    }
                  >
                    {event.image ? (
                      <div className="relative aspect-video w-full bg-muted">
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground">
                        <span className="text-4xl text-primary/30">🎟️</span>
                      </div>
                    )}

                    <div className="flex h-full flex-col p-4 sm:p-5">
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <h3 className="pr-1 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                          {event.title}
                        </h3>
                        <span className="inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {event.ticketPrice} Birr
                        </span>
                      </div>

                      <p className="min-h-0 text-sm leading-6 text-muted-foreground sm:min-h-10">
                        {event.descriptionEn}
                      </p>

                      <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-muted-foreground">
                          {event.status === "LOTTERY_COMPLETED" ? (
                            <span className="font-medium text-green-600">
                              Winners Selected
                            </span>
                          ) : isEnded ? (
                            <span className="font-medium text-amber-600">
                              Ended
                            </span>
                          ) : isSoldOut ? (
                            <span className="font-medium text-red-500">
                              Sold Out
                            </span>
                          ) : (
                            <span>
                              <strong className="text-foreground">
                                {availableTickets}
                              </strong>{" "}
                              tickets left
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-medium text-muted-foreground sm:text-right">
                          <CountdownText
                            deadline={event.deadline}
                            eventStatus={event.status}
                          />
                        </div>
                      </div>

                      {winners.length > 0 && (
                        <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-2.5 py-2 text-xs text-green-800">
                          Winners: {winners.join(", ")}
                        </p>
                      )}

                      <div className="mt-5 w-full rounded-lg bg-primary py-2.5 text-center font-medium text-primary-foreground transition-all group-hover:bg-primary/90 active:scale-[0.99]">
                        {event.status === "LOTTERY_COMPLETED"
                          ? "View Winners"
                          : isEnded
                            ? "Ended"
                            : isSoldOut
                              ? "View Details"
                              : "Cut Ticket"}
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
