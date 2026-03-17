import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getTicketTemplateConfig } from "@/lib/ticketTemplate";
import { VerifiedTicketDownload } from "@/components/tickets/VerifiedTicketDownload";
import { PhoneNumberForm } from "./PhoneNumberForm";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  searchParams,
}: {
  searchParams: { username?: string };
}) {
  const resolvedParams = await searchParams;
  const username = resolvedParams.username || "";
  const ticketTemplate = await getTicketTemplateConfig();

  const user = username
    ? await prisma.user.findUnique({
        where: { username },
        include: {
          reservations: {
            include: {
              tickets: { include: { event: true } },
              payment: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      })
    : null;

  const reservations = user?.reservations || [];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        <ThemeToggle />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-linear-to-br from-primary/10 via-accent/10 to-background px-5 py-5 md:px-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
              ETA Ticket Center
            </p>
            <h1 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">
              Ticket Cut Receipts
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Check your cut-ticket history, payment status, and winner updates
              for ETA and Ixa events.
            </p>
          </div>
        </div>

        <form
          className="mt-6 flex flex-col sm:flex-row gap-2 mb-5"
          method="GET"
          action="/receipt"
        >
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-muted-foreground">
              @
            </span>
            <input
              name="username"
              type="text"
              defaultValue={username}
              className="w-full pl-8 p-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary outline-none"
              placeholder="Enter your username..."
              required
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="text-sm font-medium text-muted-foreground mb-6">
          <Link href="/forgot-username" className="text-accent hover:underline">
            Forgot your username? Retrieve it using ticket number
          </Link>
        </div>

        {user && (
          <PhoneNumberForm
            username={user.username}
            initialPhone={user.phone ?? null}
          />
        )}

        {user && (
          <div className="mb-6 grid gap-3 rounded-xl border border-border bg-muted/20 p-4 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-border bg-background/80 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Username
              </p>
              <p className="mt-1 font-semibold text-foreground">
                @{user.username}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/80 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Phone Number
              </p>
              <p className="mt-1 font-semibold text-foreground">
                {user.phone || "Not available"}
              </p>
            </div>
          </div>
        )}

        {username && !user && (
          <div className="p-4 bg-muted text-center rounded-xl text-muted-foreground">
            No user found with username{" "}
            <span className="font-bold">@{username}</span>.
          </div>
        )}

        {user && reservations.length === 0 && (
          <div className="p-4 bg-muted text-center rounded-xl text-muted-foreground">
            No reservations found for{" "}
            <span className="font-bold">@{username}</span>.
          </div>
        )}

        <div className="space-y-4">
          {reservations.map((res) => {
            const totalAmount =
              res.tickets.length * (res.tickets[0]?.event?.ticketPrice || 0);
            const statusLabel =
              res.status === "APPROVED"
                ? "Paid"
                : res.status === "PENDING"
                  ? "Pending"
                  : res.status === "EXPIRED"
                    ? "Expired"
                    : "Rejected";

            const statusClass =
              res.status === "APPROVED"
                ? "bg-green-100 text-green-800"
                : res.status === "PENDING"
                  ? "bg-yellow-100 text-yellow-800"
                  : res.status === "EXPIRED"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-red-100 text-red-800";

            // Check if any tickets are winners
            const hasWinners = res.tickets.some(
              (ticket) => ticket.status === "WINNER",
            );
            const winnerTickets = res.tickets.filter(
              (ticket) => ticket.status === "WINNER",
            );

            return (
              <div
                key={res.id}
                className="border border-border rounded-xl p-5 bg-linear-to-b from-background to-muted/20"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Ticket Cut Receipt
                    </p>
                    <h3 className="font-semibold text-lg mt-1">
                      {res.tickets[0]?.event?.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(res.createdAt).toLocaleDateString()}
                    </p>
                    {hasWinners && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Winner Ticket
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`${statusClass} px-3 py-1 rounded-full text-xs font-semibold w-fit`}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Ticket Numbers</p>
                    <div className="flex flex-wrap gap-2">
                      {res.tickets.map((t) => (
                        <span
                          key={t.id}
                          className={`px-2 py-1 rounded text-sm font-mono ${
                            t.status === "WINNER"
                              ? "bg-yellow-100 border-yellow-300 text-yellow-800 border"
                              : "bg-background border border-border text-primary"
                          }`}
                        >
                          {t.ticketNumber}
                          {t.status === "WINNER" && " *"}
                        </span>
                      ))}
                    </div>
                    {hasWinners && (
                      <p className="text-xs text-yellow-700 mt-2 font-medium">
                        Congratulations! You have {winnerTickets.length} winning
                        ticket(s)!
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Username
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      @{user.username}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground uppercase tracking-wide">
                      Phone
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {user.phone || "Not available"}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Total Amount
                    </p>
                    <p className="text-xl font-bold text-primary mt-1">
                      {totalAmount} Birr
                    </p>
                  </div>
                </div>

                {res.status === "APPROVED" &&
                  res.payment?.status === "VERIFIED" && (
                    <div className="mt-4">
                      <VerifiedTicketDownload
                        eventTitle={
                          res.tickets[0]?.event?.title || "Verified Ticket"
                        }
                        username={user?.username || username}
                        phoneNumber={user?.phone ?? null}
                        ticketNumbers={res.tickets.map(
                          (ticket) => ticket.ticketNumber,
                        )}
                        ticketPrice={res.tickets[0]?.event?.ticketPrice || 0}
                        cutDate={res.createdAt}
                        template={ticketTemplate}
                      />
                    </div>
                  )}

                {res.status === "PENDING" && !res.payment && (
                  <div className="mt-4 text-right">
                    <Link
                      href={`/payment/${res.id}`}
                      className="text-accent text-sm font-medium hover:underline"
                    >
                      Complete Payment →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
