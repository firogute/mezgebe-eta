"use server";

import prisma from "../prisma";

export async function reserveTickets(data: {
  eventId: string;
  username: string;
  ticketIds: string[];
}) {
  try {
    // 1. Ensure user exists or create
    let user = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (!user) {
      user = await prisma.user.create({
        data: { username: data.username, role: "USER" },
      });
    }

    // 2. Wrap in transaction to prevent race conditions
    return await prisma.$transaction(async (tx) => {
      if (data.ticketIds.length === 0) {
        throw new Error("Select at least one ticket.");
      }

      if (data.ticketIds.length > 10) {
        throw new Error("You can reserve up to 10 tickets at once.");
      }

      // Confirm every selected ticket is still available for this event.
      const availableTickets = await tx.ticket.findMany({
        where: {
          eventId: data.eventId,
          id: { in: data.ticketIds },
          status: "AVAILABLE",
          reservationId: null,
        },
        select: { id: true },
      });

      if (availableTickets.length !== data.ticketIds.length) {
        throw new Error(
          "One or more selected tickets are no longer available. Please reselect from the latest list.",
        );
      }

      const ticketIds = availableTickets.map((ticket) => ticket.id);

      // Calculate Expiry (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create Reservation
      const reservation = await tx.reservation.create({
        data: {
          userId: user!.id,
          expiresAt,
          status: "PENDING",
        },
      });

      // Update Tickets
      await tx.ticket.updateMany({
        where: { id: { in: ticketIds } },
        data: {
          status: "RESERVED",
          reservationId: reservation.id,
        },
      });

      return { success: true, reservationId: reservation.id };
    });
  } catch (err: unknown) {
    console.error("Reserve error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reserve tickets",
    };
  }
}
