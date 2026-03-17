import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import TicketSelector from "./TicketSelector";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { CountdownText } from "@/components/ui/CountdownText";

export default async function EtaDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  const event = await prisma.etaEvent.findUnique({
    where: { id: slug },
    include: {
      tickets: {
        where: {
          status: "AVAILABLE",
          reservationId: null,
        },
        orderBy: { ticketNumber: "asc" },
        select: {
          id: true,
          ticketNumber: true,
        },
      },
      _count: {
        select: {
          tickets: { where: { status: "AVAILABLE" } },
        },
      },
    },
  });

  if (!event) return notFound();

  const winnerTickets = await prisma.ticket.findMany({
    where: {
      eventId: event.id,
      status: "WINNER",
    },
    orderBy: { ticketNumber: "asc" },
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
  });

  const availableTickets = event._count.tickets;
  const isExpired = new Date(event.deadline) < new Date();
  const hasSeparateAmharicDescription =
    event.descriptionAm &&
    event.descriptionAm.trim() !== event.descriptionEn.trim();

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Raffles
      </Link>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {event.image && (
            <div className="aspect-video w-full bg-muted relative">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                  {event.title}
                </h1>
                <div className="inline-flex bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                  {event.ticketPrice} Birr per ticket
                </div>
              </div>

              <div className="text-right rounded-xl border border-border bg-muted/40 px-3 py-2">
                <div className="text-xs text-muted-foreground font-medium mb-0.5">
                  Deadline Countdown
                </div>
                <div className="text-sm font-bold text-accent">
                  <CountdownText
                    deadline={event.deadline}
                    showLabel={false}
                    eventStatus={event.status}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-foreground leading-relaxed">
                {event.descriptionEn}
              </p>
              {hasSeparateAmharicDescription && (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs uppercase text-muted-foreground mb-2 tracking-wide">
                    Amharic Translation
                  </p>
                  <p
                    className="text-muted-foreground leading-relaxed font-serif"
                    dir="auto"
                  >
                    {event.descriptionAm}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="bg-card border border-border rounded-2xl p-6 md:p-8 h-fit lg:sticky lg:top-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Ticket Selection</h2>
          {event.status === "LOTTERY_COMPLETED" ? (
            <div className="space-y-3">
              <div className="p-4 bg-yellow-50 border border-yellow-200 text-center rounded-xl text-yellow-800 font-medium">
                Lottery Completed. Winners have been selected.
              </div>
              {winnerTickets.length > 0 ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-800 mb-2">
                    Winner List
                  </p>
                  <div className="space-y-2 text-sm text-green-900">
                    {winnerTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between rounded-md bg-white/70 px-2.5 py-1.5"
                      >
                        <span className="font-medium">
                          @{ticket.reservation?.user?.username || "unknown"}
                        </span>
                        <span className="text-xs text-green-700">
                          Ticket #{ticket.ticketNumber.split("-").pop()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : isExpired || event.status === "ENDED" ? (
            <div className="p-4 bg-muted text-center rounded-xl text-muted-foreground font-medium">
              This raffle has ended. Lottery will be run soon.
            </div>
          ) : availableTickets === 0 ? (
            <div className="p-4 bg-muted text-center rounded-xl text-muted-foreground font-medium">
              Tickets are sold out!
            </div>
          ) : (
            <TicketSelector
              eventId={event.id}
              ticketPrice={event.ticketPrice}
              availableTickets={event.tickets}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
