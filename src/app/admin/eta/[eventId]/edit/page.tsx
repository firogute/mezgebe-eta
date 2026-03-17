import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import EditEtaEventForm from "./EditEtaEventForm";

function toDateTimeLocalValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default async function AdminEtaEditPage({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = await params;

  const event = await prisma.etaEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-foreground">Edit ETA Event</h1>
        <Link
          href={`/admin/eta/${event.id}`}
          className="px-4 py-2 rounded-md border border-border hover:bg-muted text-sm"
        >
          Back To Details
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <EditEtaEventForm
          eventId={event.id}
          initialTitle={event.title}
          initialDescriptionEn={event.descriptionEn}
          initialTicketPrice={event.ticketPrice}
          initialWinnerCount={event.winnerCount}
          initialDeadlineValue={toDateTimeLocalValue(new Date(event.deadline))}
          initialBankType={event.bankType}
          initialAccountName={event.accountName}
          initialAccountNumber={event.accountNumber}
          initialImage={event.image}
        />
      </div>
    </div>
  );
}
