"use server";

import prisma from "../prisma";
import { normalizeEthiopianPhone } from "../phone";
import { createAdminNotification } from "../notifications";

export async function reserveTickets(data: {
  eventId: string;
  username: string;
  ticketIds: string[];
  phone?: string;
}) {
  try {
    const normalizedUsername = data.username.trim().toLowerCase();
    const normalizedPhone = data.phone
      ? normalizeEthiopianPhone(data.phone)
      : null;

    // 1. Ensure user exists or create
    const existingRows = await prisma.$queryRawUnsafe<
      Array<{ id: string; phone: string | null }>
    >(
      'SELECT "id", "phone" FROM "User" WHERE "username" = $1 LIMIT 1',
      normalizedUsername,
    );

    let userId = existingRows[0]?.id || null;
    const existingPhone = existingRows[0]?.phone || null;

    if (!userId) {
      if (!normalizedPhone) {
        throw new Error(
          "Phone number is required before completing your purchase.",
        );
      }

      const createdUser = await prisma.user.create({
        data: {
          username: normalizedUsername,
          role: "USER",
        },
      });

      userId = createdUser.id;

      await prisma.$executeRawUnsafe(
        'UPDATE "User" SET "phone" = $1 WHERE "id" = $2',
        normalizedPhone,
        userId,
      );
    } else if (!normalizeEthiopianPhone(existingPhone || "")) {
      if (!normalizedPhone) {
        throw new Error(
          "This username is missing a phone number. Add one to continue.",
        );
      }

      await prisma.$executeRawUnsafe(
        'UPDATE "User" SET "phone" = $1 WHERE "id" = $2',
        normalizedPhone,
        userId,
      );
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
          userId: userId!,
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

      await createAdminNotification({
        title: "New Reservation",
        message: `@${normalizedUsername} reserved ${ticketIds.length} ticket${ticketIds.length === 1 ? "" : "s"}.`,
        link: "/admin/payments",
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
