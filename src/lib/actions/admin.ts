"use server";

import prisma from "../prisma";
import { translateToAmharic } from "../translation";
import { revalidatePath } from "next/cache";
import { createAdminNotification } from "../notifications";

function containsAmharicText(value: string) {
  return /[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF\uAB00-\uAB2F]/.test(value);
}

async function resolveAmharicDescription(description: string) {
  const normalizedDescription = description.trim();
  if (!normalizedDescription || containsAmharicText(normalizedDescription)) {
    return null;
  }

  try {
    const translated = await translateToAmharic(normalizedDescription);
    const normalizedTranslation = translated.trim();
    return normalizedTranslation &&
      normalizedTranslation !== normalizedDescription
      ? normalizedTranslation
      : null;
  } catch (err) {
    console.error("Translation failed", err);
    return null;
  }
}

export async function createEtaEvent(data: {
  title: string;
  descriptionEn: string;
  ticketPrice: number;
  totalTickets: number;
  winnerCount: number;
  deadline: Date;
  bankType: string;
  accountName: string;
  accountNumber: string;
  image?: string;
}) {
  const normalizedDescription = data.descriptionEn.trim();
  const descriptionAm = await resolveAmharicDescription(normalizedDescription);
  const bankType = data.bankType.trim();
  const accountName = data.accountName.trim();
  const accountNumber = data.accountNumber.trim();

  // 2. Create Event
  const event = await prisma.etaEvent.create({
    data: {
      title: data.title,
      descriptionEn: normalizedDescription,
      descriptionAm,
      ticketPrice: data.ticketPrice,
      totalTickets: data.totalTickets,
      winnerCount: data.winnerCount,
      deadline: data.deadline,
      bankType,
      accountName,
      accountNumber,
      image: data.image,
    },
  });

  // 3. Generate All Tickets
  // For totalTickets, generate ETA-{eventCode}-{001...N}
  const eventCodeStr = String(event.eventCode).padStart(3, "0");

  const ticketsToCreate = Array.from({ length: data.totalTickets }).map(
    (_, i) => ({
      eventId: event.id,
      ticketNumber: `ETA-${eventCodeStr}-${String(i + 1).padStart(3, "0")}`,
      status: "AVAILABLE" as const,
    }),
  );

  // Batch insert tickets
  await prisma.ticket.createMany({
    data: ticketsToCreate,
  });

  await createAdminNotification({
    title: "Event Created",
    message: `${event.title} was created with ${data.totalTickets} tickets.`,
    link: `/admin/eta/${event.id}`,
  });

  return event;
}

export async function updateEtaEventAdmin(data: {
  eventId: string;
  title: string;
  descriptionEn: string;
  ticketPrice: number;
  winnerCount: number;
  deadline: Date;
  bankType: string;
  accountName: string;
  accountNumber: string;
  image?: string;
}) {
  try {
    const normalizedDescription = data.descriptionEn.trim();
    const descriptionAm = await resolveAmharicDescription(
      normalizedDescription,
    );
    const bankType = data.bankType.trim();
    const accountName = data.accountName.trim();
    const accountNumber = data.accountNumber.trim();

    await prisma.etaEvent.update({
      where: { id: data.eventId },
      data: {
        title: data.title,
        descriptionEn: normalizedDescription,
        descriptionAm,
        ticketPrice: data.ticketPrice,
        winnerCount: data.winnerCount,
        deadline: data.deadline,
        bankType,
        accountName,
        accountNumber,
        image: data.image || null,
      },
    });

    revalidatePath("/admin");
    revalidatePath(`/admin/eta/${data.eventId}`);
    revalidatePath(`/eta/${data.eventId}`);

    await createAdminNotification({
      title: "Event Updated",
      message: `${data.title} was updated successfully.`,
      link: `/admin/eta/${data.eventId}`,
    });

    return { success: true };
  } catch (error) {
    console.error("ETA update failed", error);
    return { success: false, error: "Failed to update ETA event." };
  }
}

export async function deleteEtaEventAdmin(data: { eventId: string }) {
  try {
    const event = await prisma.etaEvent.findUnique({
      where: { id: data.eventId },
      include: {
        tickets: {
          select: { id: true, reservationId: true, status: true },
        },
      },
    });

    if (!event) {
      return { success: false, error: "ETA event not found." };
    }

    const reservationIds = Array.from(
      new Set(
        event.tickets
          .map((ticket) => ticket.reservationId)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    await prisma.$transaction(async (tx) => {
      if (reservationIds.length > 0) {
        await tx.payment.deleteMany({
          where: { reservationId: { in: reservationIds } },
        });

        await tx.reservation.deleteMany({
          where: { id: { in: reservationIds } },
        });
      }

      await tx.etaEvent.delete({ where: { id: data.eventId } });
    });

    await createAdminNotification({
      title: "Event Deleted",
      message: `${event.title} was deleted with all related tickets and payment records.`,
      link: "/admin",
    });

    revalidatePath("/admin");
    revalidatePath("/admin/payments");
    revalidatePath("/receipt");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("ETA delete failed", error);
    return { success: false, error: "Failed to delete ETA event." };
  }
}

const allowedTicketStatuses = new Set(["AVAILABLE", "RESERVED", "SOLD"]);

export async function updateTicketAdmin(data: {
  ticketId: string;
  ticketNumber: string;
  status: string;
}) {
  try {
    const ticketNumber = data.ticketNumber.trim().toUpperCase();
    const status = data.status.toUpperCase();

    if (!ticketNumber) {
      return { success: false, error: "Ticket number cannot be empty." };
    }

    if (!allowedTicketStatuses.has(status)) {
      return { success: false, error: "Invalid ticket status." };
    }

    const existing = await prisma.ticket.findUnique({
      where: { id: data.ticketId },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Ticket not found." };
    }

    await prisma.ticket.update({
      where: { id: data.ticketId },
      data: {
        ticketNumber,
        status: status as "AVAILABLE" | "RESERVED" | "SOLD",
        ...(status === "AVAILABLE" ? { reservationId: null } : {}),
      },
    });

    revalidatePath("/admin/tickets");

    await createAdminNotification({
      title: "Ticket Updated",
      message: `${ticketNumber} was updated to ${status}.`,
      link: "/admin/tickets",
    });

    return { success: true };
  } catch (error) {
    console.error("Ticket update failed", error);
    return { success: false, error: "Failed to update ticket." };
  }
}

export async function deleteTicketAdmin(data: { ticketId: string }) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: data.ticketId },
      select: { id: true, status: true },
    });

    if (!ticket) {
      return { success: false, error: "Ticket not found." };
    }

    if (ticket.status !== "AVAILABLE") {
      return {
        success: false,
        error: "Only AVAILABLE tickets can be deleted.",
      };
    }

    await prisma.ticket.delete({ where: { id: data.ticketId } });

    await createAdminNotification({
      title: "Ticket Deleted",
      message: "An available ticket was deleted.",
      link: "/admin/tickets",
    });

    revalidatePath("/admin/tickets");
    return { success: true };
  } catch (error) {
    console.error("Ticket delete failed", error);
    return { success: false, error: "Failed to delete ticket." };
  }
}
