import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ForgotUsernamePage({ searchParams }: { searchParams: { ticket?: string } }) {
  const resolvedParams = await searchParams;
  const ticketNumber = resolvedParams.ticket || "";

  let foundUsername = null;

  if (ticketNumber) {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: { reservation: { include: { user: true } } }
    });

    if (ticket?.reservation?.user) {
      foundUsername = ticket.reservation.user.username;
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 md:p-8">
      <Link href="/receipt" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground mb-2">Forgot Username?</h1>
        <p className="text-muted-foreground text-sm mb-6">Enter any ticket number from your purchase to retrieve your username.</p>
        
        <form className="space-y-4 mb-6" method="GET" action="/forgot-username">
          <div>
            <label className="block text-sm font-medium mb-1">Ticket Number</label>
            <input 
              name="ticket" 
              type="text" 
              defaultValue={ticketNumber}
              className="w-full p-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary outline-none font-mono text-sm uppercase"
              placeholder="e.g. ETA-001-005"
              required
            />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Retrieve Username
          </button>
        </form>

        {ticketNumber && (
          <div className="mt-4 pt-4 border-t border-border/50 text-center">
            {foundUsername ? (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Your username is:</p>
                <p className="text-2xl font-bold text-primary">@{foundUsername}</p>
                <div className="mt-4">
                  <Link href={`/receipt?username=${foundUsername}`} className="text-sm font-medium text-accent hover:underline">
                    View my receipts →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-red-500 font-medium text-sm">No username found for this ticket number. Ensure it is correct and formatted like ETA-001-001.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
