"use server";

import prisma from "../prisma";
import { translateToAmharic } from "../translation";
import { revalidatePath } from "next/cache";

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
  deadline: Date;
  image?: string;
}) {
  const normalizedDescription = data.descriptionEn.trim();
  const descriptionAm = await resolveAmharicDescription(normalizedDescription);

  // 2. Create Event
  const event = await prisma.etaEvent.create({
    data: {
      title: data.title,
      descriptionEn: normalizedDescription,
      descriptionAm,
      ticketPrice: data.ticketPrice,
      totalTickets: data.totalTickets,
      deadline: data.deadline,
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

  return event;
}

export async function updateEtaEventAdmin(data: {
  eventId: string;
  title: string;
  descriptionEn: string;
  ticketPrice: number;
  deadline: Date;
  image?: string;
}) {
  try {
    const normalizedDescription = data.descriptionEn.trim();
    const descriptionAm = await resolveAmharicDescription(
      normalizedDescription,
    );

    await prisma.etaEvent.update({
      where: { id: data.eventId },
      data: {
        title: data.title,
        descriptionEn: normalizedDescription,
        descriptionAm,
        ticketPrice: data.ticketPrice,
        deadline: data.deadline,
        image: data.image || null,
      },
    });

    revalidatePath("/admin");
    revalidatePath(`/admin/eta/${data.eventId}`);
    revalidatePath(`/eta/${data.eventId}`);
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
          select: { status: true },
        },
      },
    });

    if (!event) {
      return { success: false, error: "ETA event not found." };
    }

    const hasActiveTicketUsage = event.tickets.some(
      (ticket) => ticket.status !== "AVAILABLE",
    );
    if (hasActiveTicketUsage) {
      return {
        success: false,
        error:
          "Cannot delete this ETA because some tickets are already reserved or sold.",
      };
    }

    await prisma.etaEvent.delete({ where: { id: data.eventId } });

    revalidatePath("/admin");
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

    revalidatePath("/admin/tickets");
    return { success: true };
  } catch (error) {
    console.error("Ticket delete failed", error);
    return { success: false, error: "Failed to delete ticket." };
  }
}
