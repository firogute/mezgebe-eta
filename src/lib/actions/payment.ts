"use server";

import prisma from "../prisma";
import { revalidatePath } from "next/cache";
import {
  createAdminNotification,
  createUserNotification,
} from "../notifications";

export async function verifyPayment(
  paymentId: string,
  action: "APPROVE" | "REJECT",
) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        reservation: {
          include: { tickets: true },
        },
      },
    });

    if (!payment) return { success: false, error: "Payment not found" };

    const ticketIds = payment.reservation.tickets.map((t) => t.id);

    if (action === "APPROVE") {
      if (payment.status !== "PENDING") {
        return {
          success: false,
          error: "Only pending payments can be approved.",
        };
      }

      if (payment.reservation.status !== "PENDING") {
        return {
          success: false,
          error: "Only pending reservations can be approved.",
        };
      }

      const nonReservedTicketCount = await prisma.ticket.count({
        where: {
          id: { in: ticketIds },
          OR: [
            { status: { not: "RESERVED" } },
            { reservationId: { not: payment.reservationId } },
          ],
        },
      });

      if (nonReservedTicketCount > 0) {
        return {
          success: false,
          error:
            "Cannot approve because some tickets are not in RESERVED state for this reservation.",
        };
      }

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: "VERIFIED" },
        });

        await tx.reservation.update({
          where: { id: payment.reservationId },
          data: { status: "APPROVED" },
        });

        await tx.ticket.updateMany({
          where: {
            id: { in: ticketIds },
            reservationId: payment.reservationId,
            status: "RESERVED",
          },
          data: { status: "SOLD" },
        });
      });

      await createUserNotification({
        userId: payment.reservation.userId,
        title: "Payment Approved",
        message:
          "Your payment was approved and your ticket is ready to download.",
        link: `/payment/${payment.reservationId}`,
      });

      await createAdminNotification({
        title: "Payment Approved",
        message: `Payment ${paymentId.slice(0, 8)} was approved successfully.`,
        link: "/admin/payments",
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: "REJECTED" },
        });

        await tx.reservation.update({
          where: { id: payment.reservationId },
          data: { status: "REJECTED" },
        });

        await tx.ticket.updateMany({
          where: { id: { in: ticketIds } },
          data: { status: "AVAILABLE", reservationId: null },
        });
      });

      await createUserNotification({
        userId: payment.reservation.userId,
        title: "Payment Rejected",
        message:
          "Your payment proof was rejected. Please submit a valid payment again.",
        link: `/payment/${payment.reservationId}`,
      });

      await createAdminNotification({
        title: "Payment Rejected",
        message: `Payment ${paymentId.slice(0, 8)} was rejected and tickets were released.`,
        link: "/admin/payments",
      });
    }

    revalidatePath("/admin/payments");
    revalidatePath(`/payment/${payment.reservationId}`);
    revalidatePath("/receipt");
    return { success: true };
  } catch (err) {
    console.error("Payment verification error:", err);
    return { success: false, error: "Failed to verify payment" };
  }
}
